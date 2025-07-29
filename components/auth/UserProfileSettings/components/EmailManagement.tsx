import React, { useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'

import { isClerkAPIResponseError, useUser } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'

interface EmailManagementProps {
  emailAddresses: NonNullable<ReturnType<typeof useUser>['user']>['emailAddresses']
  phoneNumbers: NonNullable<ReturnType<typeof useUser>['user']>['phoneNumbers']
  primaryEmailAddressId?: string | null
  onEmailDeleted: () => void
}

export default function EmailManagement({
  emailAddresses,
  phoneNumbers,
  primaryEmailAddressId,
  onEmailDeleted,
}: EmailManagementProps) {
  const [dropdownVisible, setDropdownVisible] = useState<string | null>(null)

  if (!emailAddresses || emailAddresses.length === 0) {
    return (
      <Text className="text-gray-500 italic">No email addresses</Text>
    )
  }

  const toggleDropdown = (emailId: string) => {
    setDropdownVisible(dropdownVisible === emailId ? null : emailId)
  }

  const closeDropdown = () => {
    setDropdownVisible(null)
  }

  const handleMakePrimary = async (emailAddress: any) => {
    closeDropdown()
    try {
      // Note: Clerk's API for making email primary may vary
      Alert.alert('Info', 'Primary email functionality needs to be implemented based on your Clerk setup')
    } catch (error: unknown) {
      if (isClerkAPIResponseError(error)) {
        const message = error.errors?.[0]?.longMessage || 'Failed to make email primary'
        Alert.alert('Error', message)
      } else {
        Alert.alert('Error', 'Failed to make email primary')
      }
    }
  }

  const handleDelete = async (emailAddress: any) => {
    closeDropdown()

    try {
      // Check if we have other verified methods before allowing deletion
      const hasOtherVerifiedEmails = emailAddresses.some(
        (email) => email.id !== emailAddress.id && email.verification?.status === 'verified'
      )
      const hasVerifiedPhone = phoneNumbers && phoneNumbers.some(
        (phone) => phone.verification?.status === 'verified'
      )

      if (!hasOtherVerifiedEmails && !hasVerifiedPhone) {
        Alert.alert(
          'Cannot Delete',
          'You must have at least one verified email or phone number to maintain account access.'
        )
        return
      }

      Alert.alert(
        'Delete Email Address',
        `Are you sure you want to delete ${emailAddress.emailAddress}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const emailWithDestroy = emailAddress as typeof emailAddress & { 
                destroy?: () => Promise<void> 
              }
              if (emailWithDestroy.destroy) {
                await emailWithDestroy.destroy()
                onEmailDeleted()
                Alert.alert('Success', 'Email address deleted successfully!')
              } else {
                Alert.alert('Error', 'Unable to delete email address')
              }
            }
          }
        ]
      )
    } catch (error: unknown) {
      if (isClerkAPIResponseError(error)) {
        const message = error.errors?.[0]?.longMessage || 'Failed to delete email address'
        Alert.alert('Error', message)
      } else {
        Alert.alert('Error', 'Failed to delete email address')
      }
    }
  }

  return (
    <View className="space-y-3">
      {emailAddresses.map((emailAddress) => {
        const isPrimary = emailAddress.id === primaryEmailAddressId
        const isVerified = emailAddress.verification?.status === 'verified'
        const showDropdown = dropdownVisible === emailAddress.id
        
        return (
          <View key={emailAddress.id} className="relative">
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">{emailAddress.emailAddress}</Text>
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
                onPress={() => toggleDropdown(emailAddress.id)}
              >
                <FontAwesome name="ellipsis-v" size={16} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Dropdown Menu */}
            {showDropdown && (
              <View className="absolute right-0 top-16 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                {!isPrimary && isVerified && (
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-3 border-b border-gray-100"
                    onPress={() => handleMakePrimary(emailAddress)}
                  >
                    <FontAwesome name="star" size={14} color="#374151" />
                    <Text className="text-gray-900 font-medium ml-3 text-sm">Make Primary</Text>
                  </TouchableOpacity>
                )}
                
                {emailAddresses.length > 1 && (
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-3"
                    onPress={() => handleDelete(emailAddress)}
                  >
                    <FontAwesome name="trash" size={14} color="#ef4444" />
                    <Text className="text-red-500 font-medium ml-3 text-sm">Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )
      })}
      
      {/* Invisible overlay to close dropdown when tapping outside */}
      {dropdownVisible && (
        <TouchableOpacity
          className="absolute inset-0 -z-10"
          onPress={closeDropdown}
          activeOpacity={1}
        />
      )}
    </View>
  )
} 