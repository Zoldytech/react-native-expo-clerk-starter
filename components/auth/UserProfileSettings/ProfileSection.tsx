import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import React, { useState } from 'react'
import { Alert, Modal, Text, TouchableOpacity, View } from 'react-native'

import { useUser } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import FormInput from '@/components/FormInput'
import ConnectedAccounts from './components/ConnectedAccounts'
import EmailManagement from './components/EmailManagement'
import PhoneManagement from './components/PhoneManagement'
import ProfileHeader from './components/ProfileHeader'

interface ProfileSectionProps {
  user: NonNullable<ReturnType<typeof useUser>['user']>
}

// Email validation schema
const emailSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Please enter a valid email address'),
})

// Email verification schema
const emailVerificationSchema = z.object({
  code: z.string({ message: 'Verification code is required' }).min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits'),
})

// Phone validation schema  
const phoneSchema = z.object({
  phone: z.string({ message: 'Phone is required' }).min(1, 'Phone number is required'),
})

type EmailFields = z.infer<typeof emailSchema>
type EmailVerificationFields = z.infer<typeof emailVerificationSchema>
type PhoneFields = z.infer<typeof phoneSchema>

export default function ProfileSection({ user }: ProfileSectionProps) {
  const { user: clerkUser } = useUser()
  const [showAddEmailModal, setShowAddEmailModal] = useState(false)
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false)
  const [showAddPhoneModal, setShowAddPhoneModal] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [isAddingEmail, setIsAddingEmail] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [isAddingPhone, setIsAddingPhone] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [pendingEmailVerification, setPendingEmailVerification] = useState<any>(null)
  const [pendingEmailAddress, setPendingEmailAddress] = useState('')

  // Get connected providers to hide them from connect options
  const connectedProviders = user.externalAccounts?.map(account => account.provider) || []
  
  // Define available providers
  const availableProviders = [
    { id: 'google', name: 'Google', icon: 'google', color: '#000000', description: 'Connect your Google account' },
    { id: 'apple', name: 'Apple', icon: 'apple', color: '#000000', description: 'Connect your Apple ID' },
  ]
  
  // Filter out already connected providers
  const unconnectedProviders = availableProviders.filter(
    provider => !connectedProviders.includes(provider.id as any)
  )

  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    reset: resetEmail,
  } = useForm<EmailFields>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const {
    control: emailVerificationControl,
    handleSubmit: handleEmailVerificationSubmit,
    reset: resetEmailVerification,
  } = useForm<EmailVerificationFields>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { code: '' },
  })

  const {
    control: phoneControl,
    handleSubmit: handlePhoneSubmit,
    reset: resetPhone,
  } = useForm<PhoneFields>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  })

  const showAddEmailOptions = () => {
    resetEmail()
    setShowAddEmailModal(true)
  }

  const handleAddEmail = async (data: EmailFields) => {
    if (!clerkUser) return

    setIsAddingEmail(true)
    try {
      // Create email address without setting as primary
      const emailAddress = await clerkUser.createEmailAddress({ 
        email: data.email,
      })
      
      // Prepare verification
      await emailAddress.prepareVerification({ strategy: 'email_code' })
      
      // Store pending verification info
      setPendingEmailVerification(emailAddress)
      setPendingEmailAddress(data.email)
      
      // Close add modal and open verification modal
      setShowAddEmailModal(false)
      resetEmail()
      resetEmailVerification()
      setShowEmailVerificationModal(true)
      
    } catch (error: any) {
      console.error('Add email error:', error)
      Alert.alert(
        'Error',
        error.errors?.[0]?.longMessage || 'Failed to add email address. Please try again.'
      )
    } finally {
      setIsAddingEmail(false)
    }
  }

  const handleEmailVerification = async (data: EmailVerificationFields) => {
    if (!pendingEmailVerification) return

    setIsVerifyingEmail(true)
    try {
      await pendingEmailVerification.attemptVerification({ code: data.code })
      
      Alert.alert(
        'Email Verified',
        'Your email address has been successfully verified!',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowEmailVerificationModal(false)
              setPendingEmailVerification(null)
              setPendingEmailAddress('')
              resetEmailVerification()
            }
          }
        ]
      )
    } catch (error: any) {
      console.error('Email verification error:', error)
      Alert.alert(
        'Verification Failed',
        error.errors?.[0]?.longMessage || 'Invalid verification code. Please try again.'
      )
    } finally {
      setIsVerifyingEmail(false)
    }
  }

  const handleResendEmailVerification = async () => {
    if (!pendingEmailVerification) return

    try {
      await pendingEmailVerification.prepareVerification({ strategy: 'email_code' })
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.')
    } catch (error: any) {
      console.error('Resend verification error:', error)
      Alert.alert(
        'Error',
        'Failed to resend verification code. Please try again.'
      )
    }
  }

  const showAddPhoneOptions = () => {
    resetPhone()
    setShowAddPhoneModal(true)
  }

  const handleAddPhone = async (data: PhoneFields) => {
    if (!clerkUser) return

    // Basic phone validation
    if (!/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
      Alert.alert('Error', 'Please enter a valid phone number')
      return
    }

    setIsAddingPhone(true)
    try {
      await clerkUser.createPhoneNumber({ phoneNumber: data.phone })
      Alert.alert(
        'Phone Added',
        'Phone number added successfully. Please check your phone for verification.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowAddPhoneModal(false)
              resetPhone()
            }
          }
        ]
      )
    } catch (error: any) {
      console.error('Add phone error:', error)
      Alert.alert(
        'Error',
        error.errors?.[0]?.longMessage || 'Failed to add phone number. Please try again.'
      )
    } finally {
      setIsAddingPhone(false)
    }
  }

  const showConnectAccountOptions = () => {
    setShowConnectModal(true)
  }

  const handleConnectProvider = async (provider: 'google' | 'apple') => {
    if (!clerkUser) return

    setIsConnecting(true)
    setShowConnectModal(false)

    try {
      const strategy = provider === 'google' ? 'oauth_google' : 'oauth_apple'
      const redirectUri = AuthSession.makeRedirectUri()
      
      // Create external account for existing user (correct method for connecting accounts)
      const externalAccount = await clerkUser.createExternalAccount({
        strategy: strategy as any,
        redirectUrl: redirectUri,
      })

      // Check if we need to complete OAuth flow in browser
      if (externalAccount.verification?.externalVerificationRedirectURL) {
        // Open OAuth flow in browser
        const result = await WebBrowser.openAuthSessionAsync(
          externalAccount.verification.externalVerificationRedirectURL.toString(),
          redirectUri
        )

        if (result.type === 'success') {
          // Wait a moment for Clerk to process the OAuth callback
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Reload user to get updated external accounts
          await clerkUser.reload()
          
          // Verify the account was actually connected by checking if it appears in external accounts
          const connectedAccount = clerkUser.externalAccounts.find(
            account => account.provider === provider
          )
          
          if (connectedAccount) {
            Alert.alert(
              'Account Connected',
              `Your ${provider === 'google' ? 'Google' : 'Apple'} account has been connected successfully!`,
              [{ text: 'OK' }]
            )
          } else {
            // Connection didn't complete properly, clean up
            console.log('Connection verification failed')
            Alert.alert(
              'Connection Failed',
              `Failed to verify ${provider} account connection. Please try again.`,
              [{ text: 'OK' }]
            )
          }
        } else if (result.type === 'cancel') {
          // User cancelled - remove the pending external account
          try {
            await externalAccount.destroy()
          } catch (cleanupError) {
            console.log('Cleanup error after cancellation:', cleanupError)
          }
          console.log('User cancelled OAuth flow')
          // Don't show error for cancellation
        } else {
          // OAuth flow failed - clean up
          try {
            await externalAccount.destroy()
          } catch (cleanupError) {
            console.log('Cleanup error after failure:', cleanupError)
          }
          throw new Error('OAuth flow was dismissed or failed')
        }
      } else {
        // Account connected immediately (rare case)
        await clerkUser.reload()
        Alert.alert(
          'Account Connected',
          `Your ${provider === 'google' ? 'Google' : 'Apple'} account has been connected successfully!`,
          [{ text: 'OK' }]
        )
      }
    } catch (error: any) {
      console.error('Connect account error:', error)
      
      // Handle specific error cases
      if (error.errors && error.errors.length > 0) {
        const firstError = error.errors[0]
        
        if (firstError.code === 'external_account_exists') {
          Alert.alert(
            'Account Already Connected',
            `This ${provider} account is already connected to another user or to your account.`,
            [{ text: 'OK' }]
          )
        } else if (firstError.code === 'oauth_access_denied') {
          Alert.alert(
            'Access Denied',
            `You denied access to your ${provider} account. Please try again and grant permission.`,
            [{ text: 'OK' }]
          )
        } else {
          Alert.alert(
            'Connection Failed',
            firstError.longMessage || firstError.message || `Failed to connect ${provider} account.`,
            [{ text: 'OK' }]
          )
        }
      } else {
        Alert.alert(
          'Connection Failed',
          `Failed to connect ${provider} account. Please try again.`,
          [{ text: 'OK' }]
        )
      }
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <View className="flex-1">
      {/* Profile Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-6">
        <Text className="text-xl font-semibold text-gray-900 mb-6">Profile details</Text>
        <ProfileHeader user={user} />
      </View>

      {/* Email Addresses */}
      <View className="bg-white border-b border-gray-200 px-6 py-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-medium text-gray-900">Email addresses</Text>
        </View>
        
        <EmailManagement 
          emailAddresses={user.emailAddresses}
          phoneNumbers={user.phoneNumbers || []}
          primaryEmailAddressId={user.primaryEmailAddressId}
          onEmailDeleted={() => clerkUser?.reload()}
        />
        
        <TouchableOpacity
          onPress={showAddEmailOptions}
          className="flex-row items-center mt-4"
        >
          <FontAwesome name="plus" size={16} color="#374151" />
          <Text className="text-gray-700 font-medium ml-2">Add email address</Text>
        </TouchableOpacity>
      </View>

      {/* Phone Numbers */}
      <View className="bg-white border-b border-gray-200 px-6 py-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-medium text-gray-900">Phone number</Text>
        </View>
        
        <PhoneManagement 
          phoneNumbers={user.phoneNumbers || []}
          emailAddresses={user.emailAddresses}
          primaryPhoneNumberId={user.primaryPhoneNumberId}
          onPhoneDeleted={() => clerkUser?.reload()}
        />
        
        <TouchableOpacity
          onPress={showAddPhoneOptions}
          className="flex-row items-center mt-4"
        >
          <FontAwesome name="plus" size={16} color="#374151" />
          <Text className="text-gray-700 font-medium ml-2">Add phone number</Text>
        </TouchableOpacity>
      </View>

      {/* Connected Accounts */}
      <View className="bg-white border-b border-gray-200 px-6 py-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-medium text-gray-900">Connected accounts</Text>
        </View>
        
        <ConnectedAccounts 
          externalAccounts={user.externalAccounts || []}
          onAccountDisconnected={() => clerkUser?.reload()}
        />
        
        {/* Only show Connect account button if there are unconnected providers */}
        {unconnectedProviders.length > 0 && (
          <TouchableOpacity
            onPress={showConnectAccountOptions}
            className="flex-row items-center mt-4"
          >
            <FontAwesome name="plus" size={16} color="#374151" />
            <Text className="text-gray-700 font-medium ml-2">Connect account</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom spacing */}
      <View className="h-20" />

      {/* Add Email Modal */}
      <Modal
        visible={showAddEmailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
                         <TouchableOpacity onPress={() => setShowAddEmailModal(false)}>
               <Text className="text-gray-700 font-medium">Cancel</Text>
             </TouchableOpacity>
             <Text className="text-lg font-semibold">Add Email</Text>
             <TouchableOpacity 
               onPress={handleEmailSubmit(handleAddEmail)}
               disabled={isAddingEmail}
             >
               <Text className={`font-medium ${
                 isAddingEmail ? 'text-gray-400' : 'text-gray-700'
               }`}>
                 {isAddingEmail ? 'Adding...' : 'Add'}
               </Text>
             </TouchableOpacity>
          </View>

          <View className="p-6">
            <View className="mb-4">
              <FormInput
                control={emailControl}
                name="email"
                label="Email Address"
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            <Text className="text-gray-500 text-sm">
              You&apos;ll be prompted to verify this email address immediately after adding it.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Email Verification Modal */}
      <Modal
        visible={showEmailVerificationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
            <TouchableOpacity onPress={() => setShowEmailVerificationModal(false)}>
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Verify Email</Text>
            <TouchableOpacity 
              onPress={handleEmailVerificationSubmit(handleEmailVerification)}
              disabled={isVerifyingEmail}
            >
              <Text className={`font-medium ${
                isVerifyingEmail ? 'text-gray-400' : 'text-gray-700'
              }`}>
                {isVerifyingEmail ? 'Verifying...' : 'Verify'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="p-6">
            <Text className="text-gray-900 font-medium mb-2">
              Check your email
            </Text>
            <Text className="text-gray-600 mb-6">
              We&apos;ve sent a verification code to {pendingEmailAddress}. Enter the 6-digit code below.
            </Text>

            <View className="mb-6">
              <FormInput
                control={emailVerificationControl}
                name="code"
                label="Verification Code"
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
                autoComplete="one-time-code"
              />
            </View>

            <TouchableOpacity 
              onPress={handleResendEmailVerification}
              className="items-center py-3"
            >
              <Text className="text-gray-700 font-medium">
                Didn&apos;t receive the code? Resend
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Phone Modal */}
      <Modal
        visible={showAddPhoneModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
            <TouchableOpacity onPress={() => setShowAddPhoneModal(false)}>
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Add Phone</Text>
            <TouchableOpacity 
              onPress={handlePhoneSubmit(handleAddPhone)}
              disabled={isAddingPhone}
            >
              <Text className={`font-medium ${
                isAddingPhone ? 'text-gray-400' : 'text-gray-700'
              }`}>
                {isAddingPhone ? 'Adding...' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="p-6">
            <View className="mb-4">
              <FormInput
                control={phoneControl}
                name="phone"
                label="Phone Number"
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>
            <Text className="text-gray-500 text-sm">
              Include country code (e.g., +1 555-123-4567)
            </Text>
          </View>
                 </View>
       </Modal>

       {/* Connect Account Modal */}
       <Modal
         visible={showConnectModal}
         animationType="slide"
         presentationStyle="pageSheet"
       >
         <View className="flex-1 bg-gray-50">
           <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
             <TouchableOpacity onPress={() => setShowConnectModal(false)}>
               <Text className="text-gray-700 font-medium">Cancel</Text>
             </TouchableOpacity>
             <Text className="text-lg font-semibold">Connect Account</Text>
             <View className="w-16" />
           </View>

           <View className="p-6">
             <Text className="text-gray-600 mb-6">
               Choose a provider to connect to your account
             </Text>

             {/* Dynamically render unconnected providers */}
             {unconnectedProviders.map((provider, index) => (
               <TouchableOpacity
                 key={provider.id}
                 onPress={() => handleConnectProvider(provider.id as 'google' | 'apple')}
                 disabled={isConnecting}
                 className={`flex-row items-center p-4 bg-white rounded-lg border border-gray-200 ${
                   index < unconnectedProviders.length - 1 ? 'mb-4' : ''
                 } ${isConnecting ? 'opacity-50' : 'active:bg-gray-50'}`}
               >
                 <View className="w-8 h-8 items-center justify-center mr-4">
                   <FontAwesome name={provider.icon as any} size={20} color={provider.color} />
                 </View>
                 <View className="flex-1">
                   <Text className="text-gray-900 font-medium">{provider.name}</Text>
                   <Text className="text-gray-600 text-sm">{provider.description}</Text>
                 </View>
                 <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
               </TouchableOpacity>
             ))}

             {/* Show message if all providers are connected */}
             {unconnectedProviders.length === 0 && (
               <View className="items-center py-8">
                 <FontAwesome name="check-circle" size={48} color="#10B981" />
                 <Text className="text-gray-900 font-medium mt-4 mb-2">All Set!</Text>
                 <Text className="text-gray-600 text-center">
                   You&apos;ve connected all available account providers.
                 </Text>
               </View>
             )}

             {isConnecting && (
               <View className="mt-6 items-center">
                 <Text className="text-gray-600">Connecting account...</Text>
               </View>
             )}
           </View>
         </View>
       </Modal>
    </View>
  )
} 