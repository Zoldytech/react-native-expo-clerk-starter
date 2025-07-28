import React from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'

import { FontAwesome } from '@expo/vector-icons'
import { useUser } from '@clerk/clerk-expo'

interface PhoneManagementProps {
  user: {
    phoneNumbers?: Array<{
      id: string
      phoneNumber: string
      verification?: { status: string }
    }>
    primaryPhoneNumberId?: string | null
    emailAddresses: Array<{
      id: string
      emailAddress: string
      verification?: { status: string }
    }>
  }
}

export default function PhoneManagement({ user }: PhoneManagementProps) {
  const { user: clerkUser } = useUser()

  const getPhoneFromClerk = (phoneNumber: string) => {
    return clerkUser?.phoneNumbers.find(p => p.phoneNumber === phoneNumber)
  }

  const handleDeletePhone = async (phoneToDelete: any) => {
    if (!clerkUser || !phoneToDelete) return

    // Check if user has at least one verified email or phone after deletion
    const verifiedEmails = user.emailAddresses.filter(
      (email: { id: string; emailAddress: string; verification?: { status: string } }) => 
        email.verification?.status === 'verified'
    )
    const otherVerifiedPhones = user.phoneNumbers?.filter(
      phone => phone.id !== phoneToDelete.id && phone.verification?.status === 'verified'
    ) || []
    
    const hasOtherVerifiedContact = verifiedEmails.length > 0 || otherVerifiedPhones.length > 0

    if (!hasOtherVerifiedContact) {
      Alert.alert(
        'Cannot Delete Phone',
        'You must have at least one verified email address or phone number.',
        [{ text: 'OK' }]
      )
      return
    }

    Alert.alert(
      'Delete Phone Number',
      `Are you sure you want to delete ${phoneToDelete.phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await phoneToDelete.destroy()
              Alert.alert('Success', 'Phone number deleted successfully.')
            } catch (error: any) {
              console.error('Delete phone error:', error)
              Alert.alert(
                'Error',
                error.errors?.[0]?.longMessage || 'Failed to delete phone number.'
              )
            }
          }
        }
      ]
    )
  }

  if (!user.phoneNumbers || user.phoneNumbers.length === 0) {
    return (
      <Text className="text-gray-500 italic">No phone numbers</Text>
    )
  }

  return (
    <View className="space-y-3">
      {user.phoneNumbers.map((phone) => {
        const clerkPhone = getPhoneFromClerk(phone.phoneNumber)
        const isVerified = phone.verification?.status === 'verified'
        // Check if this phone is the primary one using Clerk's method
        const isPrimary = clerkUser?.isPrimaryIdentification ? 
          clerkUser.isPrimaryIdentification(clerkPhone!) : 
          clerkUser?.primaryPhoneNumberId === phone.id

        return (
          <View 
            key={phone.id} 
            className="flex-row items-center justify-between py-2"
          >
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">
                {phone.phoneNumber}
              </Text>
              <View className="flex-row items-center mt-1">
                {isVerified && (
                  <View className="flex-row items-center mr-3">
                    <FontAwesome name="check-circle" size={14} color="#374151" />
                    <Text className="text-gray-700 text-sm ml-1">Verified</Text>
                  </View>
                )}
                {isPrimary && (
                  <View className="bg-gray-100 px-2 py-1 rounded">
                    <Text className="text-gray-700 text-xs font-medium">Primary</Text>
                  </View>
                )}
              </View>
            </View>
            
            <TouchableOpacity 
              className="p-2"
              onPress={() => clerkPhone && handleDeletePhone(clerkPhone)}
            >
              <FontAwesome name="trash" size={16} color="#374151" />
            </TouchableOpacity>
          </View>
        )
      })}
    </View>
  )
} 