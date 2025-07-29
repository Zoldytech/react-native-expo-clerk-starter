import React, { useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'

import { isClerkAPIResponseError, useUser } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'

interface PhoneManagementProps {
  phoneNumbers: NonNullable<ReturnType<typeof useUser>['user']>['phoneNumbers']
  emailAddresses: NonNullable<ReturnType<typeof useUser>['user']>['emailAddresses']
  primaryPhoneNumberId?: string | null
  onPhoneDeleted: () => void
}

export default function PhoneManagement({
  phoneNumbers,
  emailAddresses,
  primaryPhoneNumberId,
  onPhoneDeleted,
}: PhoneManagementProps) {
  const [dropdownVisible, setDropdownVisible] = useState<string | null>(null)

  const toggleDropdown = (phoneId: string) => {
    setDropdownVisible(dropdownVisible === phoneId ? null : phoneId)
  }

  const closeDropdown = () => {
    setDropdownVisible(null)
  }

  const handleMakePrimary = async (phone: any) => {
    closeDropdown()
    try {
      // Note: Clerk's API for making phone primary may vary
      Alert.alert('Info', 'Primary phone functionality needs to be implemented based on your Clerk setup')
    } catch (error: unknown) {
      if (isClerkAPIResponseError(error)) {
        const message = error.errors?.[0]?.longMessage || 'Failed to make phone primary'
        Alert.alert('Error', message)
      } else {
        Alert.alert('Error', 'Failed to make phone primary')
      }
    }
  }

  const handleDelete = async (phoneToDelete: any) => {
    closeDropdown()

    try {
      // Check if user has at least one verified email or phone after deletion
      const otherVerifiedPhones = phoneNumbers?.filter(
        (phone) => phone.id !== phoneToDelete.id && phone.verification?.status === 'verified'
      ) || []
      const verifiedEmails = emailAddresses.filter(
        (email) => email.verification?.status === 'verified'
      )
      
      const hasOtherVerifiedContact = otherVerifiedPhones.length > 0 || verifiedEmails.length > 0

      if (!hasOtherVerifiedContact) {
        Alert.alert(
          'Cannot Delete Phone',
          'You must have at least one verified phone number or email address.',
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
              const phoneWithDestroy = phoneToDelete as typeof phoneToDelete & { 
                destroy?: () => Promise<void> 
              }
              if (phoneWithDestroy.destroy) {
                await phoneWithDestroy.destroy()
                onPhoneDeleted()
                Alert.alert('Success', 'Phone number deleted successfully!')
              } else {
                Alert.alert('Error', 'Unable to delete phone number')
              }
            }
          }
        ]
      )
    } catch (error: unknown) {
      if (isClerkAPIResponseError(error)) {
        const message = error.errors?.[0]?.longMessage || 'Failed to delete phone number'
        Alert.alert('Error', message)
      } else {
        Alert.alert('Error', 'Failed to delete phone number')
      }
    }
  }

  if (!phoneNumbers || phoneNumbers.length === 0) {
    return (
      <Text className="text-gray-500 italic">No phone numbers</Text>
    )
  }

  return (
    <View className="space-y-3">
      {phoneNumbers.map((phone: any) => {
        const isPrimary = phone.id === primaryPhoneNumberId
        const isVerified = phone.verification?.status === 'verified'
        const showDropdown = dropdownVisible === phone.id
        
        return (
          <View key={phone.id} className="relative">
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">{phone.phoneNumber}</Text>
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
                onPress={() => toggleDropdown(phone.id)}
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
                    onPress={() => handleMakePrimary(phone)}
                  >
                    <FontAwesome name="star" size={14} color="#374151" />
                    <Text className="text-gray-900 font-medium ml-3 text-sm">Make Primary</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3"
                  onPress={() => handleDelete(phone)}
                >
                  <FontAwesome name="trash" size={14} color="#ef4444" />
                  <Text className="text-red-500 font-medium ml-3 text-sm">Delete</Text>
                </TouchableOpacity>
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