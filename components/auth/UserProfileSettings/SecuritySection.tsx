import React, { useEffect, useState } from 'react'
import { Alert, Modal, Platform, Text, TouchableOpacity, View } from 'react-native'

import { useUser } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import FormInput from '@/components/FormInput'

interface SecuritySectionProps {
  user: {
    id: string
    emailAddresses: {
      id: string
      emailAddress: string
      verification?: { status: string }
    }[]
    primaryEmailAddressId?: string | null
    phoneNumbers?: {
      id: string
      phoneNumber: string
      verification?: { status: string }
    }[]
    primaryPhoneNumberId?: string | null
    firstName?: string
    lastName?: string
    imageUrl?: string
  }
}

// Password update validation schema
const passwordUpdateSchema = z.object({
  currentPassword: z.string({ message: 'Current password is required' }).min(1, 'Current password is required'),
  newPassword: z.string({ message: 'New password is required' }).min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string({ message: 'Confirm password is required' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
})

type PasswordUpdateFields = z.infer<typeof passwordUpdateSchema>

export default function SecuritySection({ user }: SecuritySectionProps) {
  const { user: clerkUser } = useUser()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Passkey-related state
  const [isPasskeySupported, setIsPasskeySupported] = useState(false)
  const [isCheckingSupport, setIsCheckingSupport] = useState(true)
  const [isCreatingPasskey, setIsCreatingPasskey] = useState(false)
  const [isDeletingPasskey, setIsDeletingPasskey] = useState('')

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordUpdateFields>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // Check passkey support on component mount
  useEffect(() => {
    checkPasskeySupport()
  }, [])

  const checkPasskeySupport = async () => {
    setIsCheckingSupport(true)
    
    try {
      // Check if Clerk has passkey support
      if (!clerkUser) {
        setIsPasskeySupported(false)
        setIsCheckingSupport(false)
        return
      }

      // Check for Clerk passkey API availability
      const hasCreatePasskey = typeof (clerkUser as any).createPasskey === 'function'
      const hasPasskeysProperty = 'passkeys' in clerkUser
      
      // Check if isSupported method exists (this is what's missing in Clerk Expo)
      const hasIsSupported = typeof (clerkUser as any).isSupported === 'function'
      
      if (!hasCreatePasskey || !hasPasskeysProperty) {
        console.log('Clerk passkey API not fully available')
        setIsPasskeySupported(false)
        setIsCheckingSupport(false)
        return
      }

      // If isSupported method exists, use it
      if (hasIsSupported) {
        try {
          const isSupported = await (clerkUser as any).isSupported('passkey')
          if (!isSupported) {
            console.log('Passkeys not supported by Clerk')
            setIsPasskeySupported(false)
            setIsCheckingSupport(false)
            return
          }
        } catch (error) {
          console.log('Error checking Clerk passkey support:', error)
          setIsPasskeySupported(false)
          setIsCheckingSupport(false)
          return
        }
      }

      // Check platform support
      let platformSupported = false
      
      if (Platform.OS === 'web') {
        platformSupported = typeof window !== 'undefined' && 
          'credentials' in navigator && 
          'create' in navigator.credentials &&
          typeof PublicKeyCredential !== 'undefined'
      } else if (Platform.OS === 'ios') {
        // iOS 16+ supports passkeys
        platformSupported = true
      } else if (Platform.OS === 'android') {
        // Android with Google Play Services supports passkeys
        platformSupported = true
      }

      // Only enable if both Clerk and platform support passkeys
      setIsPasskeySupported(platformSupported && hasCreatePasskey)
      
    } catch (error) {
      console.log('Error checking passkey support:', error)
      setIsPasskeySupported(false)
    } finally {
      setIsCheckingSupport(false)
    }
  }

  const handleUpdatePassword = () => {
    reset()
    setShowPasswordModal(true)
  }

  const handlePasswordSubmit = async (data: PasswordUpdateFields) => {
    if (!clerkUser) return

    setIsUpdating(true)
    try {
      await clerkUser.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      
      Alert.alert(
        'Success',
        'Your password has been updated successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPasswordModal(false)
              reset()
            }
          }
        ]
      )
    } catch (error: any) {
      console.error('Password update error:', error)
      Alert.alert(
        'Error',
        error.errors?.[0]?.longMessage || 'Failed to update password. Please try again.'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCreatePasskey = async () => {
    if (!clerkUser) {
      Alert.alert('Error', 'User not found. Please try again.')
      return
    }

    // Double-check API availability
    if (typeof (clerkUser as any).createPasskey !== 'function') {
      Alert.alert(
        'Feature Not Available',
        'Passkey creation is not available in this version of Clerk. This feature is still in development for Expo apps.',
        [{ text: 'OK' }]
      )
      return
    }

    if (!isPasskeySupported) {
      Alert.alert(
        'Passkeys Not Supported',
        getPasskeyUnsupportedMessage(),
        [{ text: 'OK' }]
      )
      return
    }

    setIsCreatingPasskey(true)
    try {
      // Check if isSupported method exists before creating
      const hasIsSupported = typeof (clerkUser as any).isSupported === 'function'
      
      if (hasIsSupported) {
        const isSupported = await (clerkUser as any).isSupported('passkey')
        if (!isSupported) {
          throw new Error('Passkeys are not supported in this environment')
        }
      }

      await (clerkUser as any).createPasskey()
      Alert.alert(
        'Passkey Created',
        'Your passkey has been created successfully and is now available for sign-in.',
        [{ text: 'OK' }]
      )
    } catch (error: any) {
      console.error('Create passkey error:', error)
      
      // Handle specific Clerk error cases
      if (error.message?.includes('isSupported') || 
          error.message?.includes('missing') ||
          error.message?.includes('not available') ||
          error.message?.includes('not supported')) {
        Alert.alert(
          'Feature Not Ready',
          'Passkey support is still being developed for Expo apps. This feature will be available in a future update.',
          [{ text: 'OK' }]
        )
        return
      }
      
      // Handle user cancellation
      if (error.message?.includes('cancelled') || 
          error.message?.includes('aborted') || 
          error.message?.includes('AbortError') ||
          error.message?.includes('user_cancelled')) {
        console.log('User cancelled passkey creation')
        return
      }
      
      let errorMessage = 'Failed to create passkey. Please try again.'
      
      if (error.errors && error.errors.length > 0) {
        const firstError = error.errors[0]
        errorMessage = firstError.longMessage || firstError.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      Alert.alert(
        'Passkey Creation Failed',
        errorMessage,
        [{ text: 'OK' }]
      )
    } finally {
      setIsCreatingPasskey(false)
    }
  }

  const handleDeletePasskey = (passkeyId: string, passkeyName: string) => {
    Alert.alert(
      'Delete Passkey',
      `Are you sure you want to delete "${passkeyName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePasskey(passkeyId)
        },
      ]
    )
  }

  const deletePasskey = async (passkeyId: string) => {
    if (!clerkUser?.passkeys) return

    setIsDeletingPasskey(passkeyId)
    try {
      const passkeyToDelete = clerkUser.passkeys.find((pk: any) => pk.id === passkeyId)
      if (passkeyToDelete) {
        const passkeyAny = passkeyToDelete as any
        
        if (typeof passkeyAny.destroy === 'function') {
          await passkeyAny.destroy()
        } else if (typeof passkeyAny.delete === 'function') {
          await passkeyAny.delete()
        } else if (typeof passkeyAny.remove === 'function') {
          await passkeyAny.remove()
        } else {
          throw new Error('Passkey deletion method not available')
        }
        
        Alert.alert('Success', 'Passkey deleted successfully.', [{ text: 'OK' }])
      } else {
        throw new Error('Passkey not found')
      }
    } catch (error: any) {
      console.error('Delete passkey error:', error)
      Alert.alert(
        'Error',
        error.errors?.[0]?.longMessage || error.message || 'Failed to delete passkey. Please try again.'
      )
    } finally {
      setIsDeletingPasskey('')
    }
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: confirmDeleteAccount
        },
      ]
    )
  }

  const confirmDeleteAccount = async () => {
    if (!clerkUser) return

    setIsDeleting(true)
    try {
      await clerkUser.delete()
      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted.',
        [{ text: 'OK' }]
      )
    } catch (error: any) {
      console.error('Account deletion error:', error)
      Alert.alert(
        'Error',
        error.errors?.[0]?.longMessage || 'Failed to delete account. Please try again.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dateObj)
  }

  const getPasskeyUnsupportedMessage = () => {
    if (Platform.OS === 'web') {
      return 'Passkeys require a modern browser with WebAuthn support. This feature is also still in development for Clerk Expo apps.'
    } else if (Platform.OS === 'ios') {
      return 'Passkeys require iOS 16 or later and are still in development for Clerk Expo apps.'
    } else if (Platform.OS === 'android') {
      return 'Passkeys require Android with Google Play Services and are still in development for Clerk Expo apps.'
    } else {
      return 'Passkeys are not supported on this platform and are still in development for Clerk Expo apps.'
    }
  }

  // Get passkeys from clerkUser
  const passkeys = clerkUser?.passkeys || []
  const hasPasskeyAPI = clerkUser && typeof (clerkUser as any).createPasskey === 'function'
  const hasIsSupported = clerkUser && typeof (clerkUser as any).isSupported === 'function'
  
  // Only show passkeys section if there's some level of API support
  const shouldShowPasskeys = hasPasskeyAPI || passkeys.length > 0

  return (
    <View className="flex-1">
      {/* Password */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-900">Password</Text>
            <Text className="text-gray-500 text-sm">••••••••••</Text>
          </View>
          
          <TouchableOpacity
            onPress={handleUpdatePassword}
            className="bg-black rounded-lg px-3 py-2"
          >
            <Text className="text-white font-medium text-sm">Update</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Passkeys */}
      {shouldShowPasskeys && (
        <View className="bg-white border-b border-gray-200 px-6 py-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">Passkeys</Text>
              <Text className="text-gray-500 text-sm">
                {passkeys.length > 0 ? `${passkeys.length} passkey${passkeys.length > 1 ? 's' : ''}` : 'Enhanced security'}
              </Text>
            </View>
            
                       <TouchableOpacity
             onPress={handleCreatePasskey}
             disabled={isCreatingPasskey || !hasPasskeyAPI || !isPasskeySupported || isCheckingSupport || !hasIsSupported}
             className={`rounded-lg px-3 py-2 ${
               hasPasskeyAPI && isPasskeySupported && !isCheckingSupport && hasIsSupported
                 ? 'bg-black' 
                 : 'bg-gray-300'
             }`}
           >
             <Text className={`font-medium text-sm ${
               hasPasskeyAPI && isPasskeySupported && !isCheckingSupport && hasIsSupported ? 'text-white' : 'text-gray-500'
             }`}>
               {isCheckingSupport 
                 ? 'Checking...' 
                 : isCreatingPasskey 
                   ? 'Creating...' 
                   : !hasPasskeyAPI
                     ? 'Unavailable'
                     : !hasIsSupported
                       ? 'Coming Soon'
                       : !isPasskeySupported 
                         ? 'Not supported'
                         : 'Add'
               }
             </Text>
           </TouchableOpacity>
          </View>
          
          {passkeys.length > 0 && (
            <View className="mt-2">
              {passkeys.map((passkey: any, index: number) => (
                <View key={passkey.id} className={`flex-row items-center justify-between py-2 ${
                  index < passkeys.length - 1 ? 'border-b border-gray-100' : ''
                }`}>
                  <View className="flex-row items-center flex-1">
                    <View className="w-6 h-6 bg-green-100 rounded items-center justify-center mr-3">
                      <FontAwesome name="key" size={12} color="#10B981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium text-sm">
                        {passkey.name || `Passkey ${passkey.id.slice(-4)}`}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {formatDate(passkey.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeletePasskey(passkey.id, passkey.name || `Passkey ${passkey.id.slice(-4)}`)}
                    disabled={isDeletingPasskey === passkey.id}
                    className="p-1"
                  >
                    {isDeletingPasskey === passkey.id ? (
                      <FontAwesome name="spinner" size={14} color="#ef4444" />
                    ) : (
                      <FontAwesome name="trash" size={14} color="#ef4444" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Delete Account */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-900">Delete account</Text>
            <Text className="text-gray-500 text-sm">Permanently delete your account</Text>
          </View>
          
          <TouchableOpacity
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            className="bg-white border border-red-500 rounded-lg px-3 py-2"
          >
            <Text className="text-red-500 font-medium text-sm">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom spacing */}
      <View className="h-20" />

      {/* Password Update Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Update Password</Text>
            <TouchableOpacity 
              onPress={handleSubmit(handlePasswordSubmit)}
              disabled={isUpdating}
            >
              <Text className={`font-medium ${
                isUpdating ? 'text-gray-400' : 'text-gray-700'
              }`}>
                {isUpdating ? 'Updating...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="p-6">
            <View className="mb-4">
              <FormInput
                control={control}
                name="currentPassword"
                label="Current Password"
                placeholder="Enter current password"
                secureTextEntry
                autoComplete="current-password"
              />
            </View>

            <View className="mb-4">
              <FormInput
                control={control}
                name="newPassword"
                label="New Password"
                placeholder="Enter new password"
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <View className="mb-4">
              <FormInput
                control={control}
                name="confirmPassword"
                label="Confirm New Password"
                placeholder="Confirm new password"
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <Text className="text-gray-500 text-sm">
              Password must be at least 8 characters long
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  )
} 