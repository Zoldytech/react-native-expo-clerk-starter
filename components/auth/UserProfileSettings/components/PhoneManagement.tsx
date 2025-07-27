import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

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
  }
}

export default function PhoneManagement({ user }: PhoneManagementProps) {
  const { user: clerkUser } = useUser()

  const getPhoneFromClerk = (phoneNumber: string) => {
    return clerkUser?.phoneNumbers.find(p => p.phoneNumber === phoneNumber)
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
                    <FontAwesome name="check-circle" size={14} color="#10B981" />
                    <Text className="text-green-600 text-sm ml-1">Verified</Text>
                  </View>
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
  )
} 