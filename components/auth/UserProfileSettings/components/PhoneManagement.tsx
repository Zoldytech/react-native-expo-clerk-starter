import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

import { FontAwesome } from '@expo/vector-icons'

interface PhoneManagementProps {
  user: {
    phoneNumbers?: Array<{
      id: string
      phoneNumber: string
      verification?: { status: string }
    }>
  }
}

export default function PhoneManagement({ user }: PhoneManagementProps) {
  if (!user.phoneNumbers || user.phoneNumbers.length === 0) {
    return (
      <Text className="text-gray-500 italic">No phone numbers</Text>
    )
  }

  return (
    <View className="space-y-3">
      {user.phoneNumbers.map((phone) => (
        <View 
          key={phone.id} 
          className="flex-row items-center justify-between py-2"
        >
          <View className="flex-1">
            <Text className="text-gray-900 font-medium">
              {phone.phoneNumber}
            </Text>
            <View className="flex-row items-center mt-1">
              {phone.verification?.status === 'verified' && (
                <View className="flex-row items-center mr-3">
                  <FontAwesome name="check-circle" size={14} color="#10B981" />
                  <Text className="text-green-600 text-sm ml-1">Verified</Text>
                </View>
              )}
              {/* Note: Clerk's primary phone is typically the first one */}
              {user.phoneNumbers?.indexOf(phone) === 0 && (
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
      ))}
    </View>
  )
} 