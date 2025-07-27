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
    phoneNumbers?: Array<{
      id: string
      phoneNumber: string
      verification?: { status: string }
    }>
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

// Phone validation schema  
const phoneSchema = z.object({
  phone: z.string({ message: 'Phone is required' }).min(1, 'Phone number is required'),
})

type EmailFields = z.infer<typeof emailSchema>
type PhoneFields = z.infer<typeof phoneSchema>

export default function ProfileSection({ user }: ProfileSectionProps) {
  const { user: clerkUser } = useUser()
  const [showAddEmailModal, setShowAddEmailModal] = useState(false)
  const [showAddPhoneModal, setShowAddPhoneModal] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [isAddingEmail, setIsAddingEmail] = useState(false)
  const [isAddingPhone, setIsAddingPhone] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

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
      await clerkUser.createEmailAddress({ email: data.email })
      Alert.alert(
        'Email Added',
        'Email address added successfully. Please check your email for verification.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowAddEmailModal(false)
              resetEmail()
            }
          }
        ]
      )
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
              A verification email will be sent to this address
            </Text>
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