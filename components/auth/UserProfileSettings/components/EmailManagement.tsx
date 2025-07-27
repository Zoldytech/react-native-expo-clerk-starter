import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Alert, Modal } from 'react-native'

import { FontAwesome } from '@expo/vector-icons'
import { useUser } from '@clerk/clerk-expo'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import FormInput from '@/components/FormInput'

// Email verification schema
const emailVerificationSchema = z.object({
  code: z.string({ message: 'Verification code is required' }).min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits'),
})

type EmailVerificationFields = z.infer<typeof emailVerificationSchema>

interface EmailManagementProps {
  user: {
    emailAddresses: Array<{
      id: string
      emailAddress: string
      verification?: { status: string }
    }>
    primaryEmailAddressId?: string | null
  }
}

export default function EmailManagement({ user }: EmailManagementProps) {
  const { user: clerkUser } = useUser()
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyingEmail, setVerifyingEmail] = useState<any>(null)
  const [verifyingEmailAddress, setVerifyingEmailAddress] = useState('')

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailVerificationFields>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { code: '' },
  })
  const handleVerifyEmail = async (emailAddress: any) => {
    try {
      await emailAddress.prepareVerification({ strategy: 'email_code' })
      setVerifyingEmail(emailAddress)
      setVerifyingEmailAddress(emailAddress.emailAddress)
      reset()
      setShowVerificationModal(true)
    } catch (error: any) {
      console.error('Prepare verification error:', error)
      Alert.alert(
        'Error',
        'Failed to send verification code. Please try again.'
      )
    }
  }

  const handleEmailVerification = async (data: EmailVerificationFields) => {
    if (!verifyingEmail) return

    setIsVerifying(true)
    try {
      await verifyingEmail.attemptVerification({ code: data.code })
      
      Alert.alert(
        'Email Verified',
        'Your email address has been successfully verified!',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowVerificationModal(false)
              setVerifyingEmail(null)
              setVerifyingEmailAddress('')
              reset()
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
      setIsVerifying(false)
    }
  }

  const handleResendVerification = async () => {
    if (!verifyingEmail) return

    try {
      await verifyingEmail.prepareVerification({ strategy: 'email_code' })
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.')
    } catch (error: any) {
      console.error('Resend verification error:', error)
      Alert.alert(
        'Error',
        'Failed to resend verification code. Please try again.'
      )
    }
  }

  if (!user.emailAddresses || user.emailAddresses.length === 0) {
    return (
      <Text className="text-gray-500 italic">No email addresses</Text>
    )
  }

  const getEmailFromClerk = (emailAddress: string) => {
    return clerkUser?.emailAddresses.find(e => e.emailAddress === emailAddress)
  }

  return (
    <>
      <View className="space-y-3">
        {user.emailAddresses.map((email) => {
          const clerkEmail = getEmailFromClerk(email.emailAddress)
          const isVerified = email.verification?.status === 'verified'
          // Check if this email is the primary one using Clerk's method
          const isPrimary = clerkUser?.isPrimaryIdentification ? 
            clerkUser.isPrimaryIdentification(clerkEmail!) : 
            clerkUser?.primaryEmailAddressId === email.id
          
          return (
            <View 
              key={email.id} 
              className="flex-row items-center justify-between py-2"
            >
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">
                  {email.emailAddress}
                </Text>
                <View className="flex-row items-center mt-1">
                  {isVerified ? (
                    <View className="flex-row items-center mr-3">
                      <FontAwesome name="check-circle" size={14} color="#10B981" />
                      <Text className="text-green-600 text-sm ml-1">Verified</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      onPress={() => clerkEmail && handleVerifyEmail(clerkEmail)}
                      className="mr-3"
                    >
                      <Text className="text-blue-500 text-sm font-medium">Verify</Text>
                    </TouchableOpacity>
                  )}
                  {isPrimary && (
                    <View className="bg-blue-100 px-2 py-1 rounded">
                      <Text className="text-blue-700 text-xs font-medium">Primary</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <TouchableOpacity className="p-2">
                <FontAwesome name="ellipsis-h" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )
        })}
      </View>

      {/* Email Verification Modal */}
      <Modal
        visible={showVerificationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
            <TouchableOpacity onPress={() => setShowVerificationModal(false)}>
              <Text className="text-blue-500 font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Verify Email</Text>
            <TouchableOpacity 
              onPress={handleSubmit(handleEmailVerification)}
              disabled={isVerifying}
            >
              <Text className={`font-medium ${
                isVerifying ? 'text-gray-400' : 'text-blue-500'
              }`}>
                {isVerifying ? 'Verifying...' : 'Verify'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="p-6">
            <Text className="text-gray-900 font-medium mb-2">
              Check your email
            </Text>
            <Text className="text-gray-600 mb-6">
              We&apos;ve sent a verification code to {verifyingEmailAddress}. Enter the 6-digit code below.
            </Text>

            <View className="mb-6">
              <FormInput
                control={control}
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
              onPress={handleResendVerification}
              className="items-center py-3"
            >
              <Text className="text-blue-500 font-medium">
                Didn&apos;t receive the code? Resend
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
} 