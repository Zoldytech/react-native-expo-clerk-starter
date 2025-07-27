import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

import { FontAwesome } from '@expo/vector-icons'

interface EmailManagementProps {
  user: {
    emailAddresses: Array<{
      id: string
      emailAddress: string
      verification?: { status: string }
    }>
  }
}

export default function EmailManagement({ user }: EmailManagementProps) {
  if (!user.emailAddresses || user.emailAddresses.length === 0) {
    return (
      <Text className="text-gray-500 italic">No email addresses</Text>
    )
  }

  return (
    <View className="space-y-3">
      {user.emailAddresses.map((email) => (
        <View 
          key={email.id} 
          className="flex-row items-center justify-between py-2"
        >
          <View className="flex-1">
            <Text className="text-gray-900 font-medium">
              {email.emailAddress}
            </Text>
            <View className="flex-row items-center mt-1">
              {email.verification?.status === 'verified' && (
                <View className="flex-row items-center mr-3">
                  <FontAwesome name="check-circle" size={14} color="#10B981" />
                  <Text className="text-green-600 text-sm ml-1">Verified</Text>
                </View>
              )}
              {/* Note: Clerk's primary email is typically the first one or marked differently */}
              {user.emailAddresses.indexOf(email) === 0 && (
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