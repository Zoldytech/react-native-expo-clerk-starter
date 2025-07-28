import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Alert, Modal } from 'react-native'

import { useUser } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import FormInput from '@/components/FormInput'

interface SecuritySectionProps {
  user: {
    id: string
    emailAddresses: Array<{
      id: string
      emailAddress: string
      verification?: { status: string }
    }>
    primaryEmailAddressId?: string | null
    phoneNumbers?: Array<{
      id: string
      phoneNumber: string
      verification?: { status: string }
    }>
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

  const handleUpdatePassword = () => {
    reset() // Reset form when opening modal
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
              reset() // Reset form after successful update
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

  return (
    <View className="flex-1">
      {/* Password */}
      <View className="bg-white border-b border-gray-200 px-6 py-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-medium text-gray-900 mb-1">Password</Text>
            <Text className="text-gray-600">••••••••••</Text>
          </View>
          
          <TouchableOpacity
            onPress={handleUpdatePassword}
            className="bg-black rounded-lg px-4 py-2"
          >
            <Text className="text-white font-medium">Update password</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Account */}
      <View className="bg-white border-b border-gray-200 px-6 py-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-medium text-gray-900 mb-1">Delete account</Text>
            <Text className="text-gray-600">Permanently delete your account and all data</Text>
          </View>
          
          <TouchableOpacity
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            className={`rounded-lg px-4 py-2 ${
              isDeleting ? 'bg-red-500' : 'bg-white border border-black'
            }`}
          >
            <Text className="font-medium">
              {isDeleting ? 'Deleting...' : 'Delete account'}
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