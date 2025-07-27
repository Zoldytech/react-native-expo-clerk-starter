import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ActionSheetIOS, Platform, Modal } from 'react-native'

import { useUser } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import FormInput from '@/components/FormInput'
import ProfileHeader from './components/ProfileHeader'
import EmailManagement from './components/EmailManagement'
import PhoneManagement from './components/PhoneManagement'
import ConnectedAccounts from './components/ConnectedAccounts'

interface ProfileSectionProps {
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
    externalAccounts?: Array<{
      id: string
      provider: string
      emailAddress?: string
      username?: string
    }>
    firstName?: string
    lastName?: string
    fullName?: string
    imageUrl?: string
  }
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

  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    reset: resetEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailFields>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const {
    control: emailVerificationControl,
    handleSubmit: handleEmailVerificationSubmit,
    reset: resetEmailVerification,
    formState: { errors: emailVerificationErrors },
  } = useForm<EmailVerificationFields>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { code: '' },
  })

  const {
    control: phoneControl,
    handleSubmit: handlePhoneSubmit,
    reset: resetPhone,
    formState: { errors: phoneErrors },
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
      // For OAuth connections, we typically need to redirect to Clerk's OAuth flow
      // This would involve using Clerk's OAuth methods and proper redirect handling
      
      // Note: This typically requires proper OAuth setup and redirects
      // For now, we'll show a message that this requires additional setup
      Alert.alert(
        'OAuth Setup Required',
        `To connect your ${provider === 'google' ? 'Google' : 'Apple'} account, additional OAuth configuration is needed in your Clerk dashboard. This includes setting up OAuth apps and redirect URIs.`,
        [{ text: 'OK' }]
      )
    } catch (error: any) {
      console.error('Connect account error:', error)
      Alert.alert(
        'Error',
        error.errors?.[0]?.longMessage || `Failed to connect ${provider} account. Please try again.`
      )
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
        
        <EmailManagement user={user} />
        
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
        
        <PhoneManagement user={user} />
        
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
        
        <ConnectedAccounts user={user} />
        
        <TouchableOpacity
          onPress={showConnectAccountOptions}
          className="flex-row items-center mt-4"
        >
          <FontAwesome name="plus" size={16} color="#374151" />
          <Text className="text-gray-700 font-medium ml-2">Connect account</Text>
        </TouchableOpacity>
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
              <Text className="text-blue-500 font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Add Email</Text>
            <TouchableOpacity 
              onPress={handleEmailSubmit(handleAddEmail)}
              disabled={isAddingEmail}
            >
              <Text className={`font-medium ${
                isAddingEmail ? 'text-gray-400' : 'text-blue-500'
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
              <Text className="text-blue-500 font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Verify Email</Text>
            <TouchableOpacity 
              onPress={handleEmailVerificationSubmit(handleEmailVerification)}
              disabled={isVerifyingEmail}
            >
              <Text className={`font-medium ${
                isVerifyingEmail ? 'text-gray-400' : 'text-blue-500'
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
              <Text className="text-blue-500 font-medium">
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
              <Text className="text-blue-500 font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Add Phone</Text>
            <TouchableOpacity 
              onPress={handlePhoneSubmit(handleAddPhone)}
              disabled={isAddingPhone}
            >
              <Text className={`font-medium ${
                isAddingPhone ? 'text-gray-400' : 'text-blue-500'
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
               <Text className="text-blue-500 font-medium">Cancel</Text>
             </TouchableOpacity>
             <Text className="text-lg font-semibold">Connect Account</Text>
             <View className="w-16" />
           </View>

           <View className="p-6">
             <Text className="text-gray-600 mb-6">
               Choose a provider to connect to your account
             </Text>

             {/* Google Option */}
             <TouchableOpacity
               onPress={() => handleConnectProvider('google')}
               disabled={isConnecting}
               className={`flex-row items-center p-4 bg-white rounded-lg border border-gray-200 mb-4 ${
                 isConnecting ? 'opacity-50' : 'active:bg-gray-50'
               }`}
             >
               <View className="w-8 h-8 items-center justify-center mr-4">
                 <FontAwesome name="google" size={20} color="#4285F4" />
               </View>
               <View className="flex-1">
                 <Text className="text-gray-900 font-medium">Google</Text>
                 <Text className="text-gray-600 text-sm">Connect your Google account</Text>
               </View>
               <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
             </TouchableOpacity>

             {/* Apple Option */}
             <TouchableOpacity
               onPress={() => handleConnectProvider('apple')}
               disabled={isConnecting}
               className={`flex-row items-center p-4 bg-white rounded-lg border border-gray-200 ${
                 isConnecting ? 'opacity-50' : 'active:bg-gray-50'
               }`}
             >
               <View className="w-8 h-8 items-center justify-center mr-4">
                 <FontAwesome name="apple" size={20} color="#000000" />
               </View>
               <View className="flex-1">
                 <Text className="text-gray-900 font-medium">Apple</Text>
                 <Text className="text-gray-600 text-sm">Connect your Apple ID</Text>
               </View>
               <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
             </TouchableOpacity>

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