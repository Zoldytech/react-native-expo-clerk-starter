import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

import { FontAwesome } from '@expo/vector-icons'

interface ConnectedAccountsProps {
  user: {
    externalAccounts?: Array<{
      id: string
      provider: string
      emailAddress?: string
      username?: string
    }>
  }
}

export default function ConnectedAccounts({ user }: ConnectedAccountsProps) {
  if (!user.externalAccounts || user.externalAccounts.length === 0) {
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
      {user.externalAccounts.map((account) => (
        <View 
          key={account.id} 
          className="flex-row items-center justify-between py-2"
        >
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
          
          <TouchableOpacity className="p-2">
            <FontAwesome name="ellipsis-h" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  )
} 