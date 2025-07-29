import React, { useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'

import { isClerkAPIResponseError, useUser } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'

interface ConnectedAccountsProps {
  externalAccounts: NonNullable<ReturnType<typeof useUser>['user']>['externalAccounts']
  onAccountDisconnected: () => void
}

export default function ConnectedAccounts({ 
  externalAccounts, 
  onAccountDisconnected 
}: ConnectedAccountsProps) {
  const [dropdownVisible, setDropdownVisible] = useState<string | null>(null)

  const toggleDropdown = (accountId: string) => {
    setDropdownVisible(dropdownVisible === accountId ? null : accountId)
  }

  const closeDropdown = () => {
    setDropdownVisible(null)
  }

  const handleDisconnect = async (account: any) => {
    closeDropdown()

    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect your ${getProviderName(account.provider)} account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const accountWithDestroy = account as typeof account & { destroy?: () => Promise<void> }
              if (accountWithDestroy.destroy) {
                await accountWithDestroy.destroy()
                Alert.alert('Success', 'Account disconnected successfully!')
                onAccountDisconnected()
              } else {
                Alert.alert('Error', 'Unable to disconnect account')
              }
            } catch (error: unknown) {
              if (isClerkAPIResponseError(error)) {
                const message = error.errors?.[0]?.longMessage || 'Failed to disconnect account'
                Alert.alert('Error', message)
              } else {
                Alert.alert('Error', 'Failed to disconnect account')
              }
            }
          }
        }
      ]
    )
  }

  if (!externalAccounts || externalAccounts.length === 0) {
    return (
      <Text className="text-gray-500 italic">No connected accounts</Text>
    )
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return 'google'
      case 'apple':
        return 'apple'
      case 'github':
        return 'github'
      case 'facebook':
        return 'facebook'
      case 'twitter':
        return 'twitter'
      default:
        return 'link'
    }
  }

  const getProviderName = (provider: string) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1)
  }

  return (
    <View className="space-y-3">
      {externalAccounts.map((account: any) => {
        const showDropdown = dropdownVisible === account.id
        
        return (
          <View key={account.id} className="relative">
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center flex-1">
                {/* Provider Icon */}
                <View className="w-8 h-8 items-center justify-center mr-3">
                  <FontAwesome 
                    name={getProviderIcon(account.provider) as any} 
                    size={20} 
                    color="#374151" 
                  />
                </View>
                
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">
                    {getProviderName(account.provider)}
                  </Text>
                  {account.emailAddress && (
                    <Text className="text-gray-600 text-sm">
                      {account.emailAddress}
                    </Text>
                  )}
                  {account.username && !account.emailAddress && (
                    <Text className="text-gray-600 text-sm">
                      @{account.username}
                    </Text>
                  )}
                </View>
              </View>
              
              <TouchableOpacity
                className="p-2"
                onPress={() => toggleDropdown(account.id)}
              >
                <FontAwesome name="ellipsis-v" size={16} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Dropdown Menu */}
            {showDropdown && (
              <View className="absolute right-0 top-16 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3"
                  onPress={() => handleDisconnect(account)}
                >
                  <FontAwesome name="unlink" size={14} color="#ef4444" />
                  <Text className="text-red-500 font-medium ml-3 text-sm">Disconnect</Text>
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