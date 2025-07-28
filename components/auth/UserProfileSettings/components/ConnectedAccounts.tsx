import React from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'

import { FontAwesome } from '@expo/vector-icons'
import { useUser } from '@clerk/clerk-expo'

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
  const { user: clerkUser } = useUser()

  const handleDisconnectAccount = async (accountId: string, provider: string) => {
    if (!clerkUser) return

    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect your ${getProviderName(provider)} account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              // Find the external account and destroy it
              const externalAccount = clerkUser.externalAccounts.find(
                (account: any) => account.id === accountId
              )
              
              if (externalAccount) {
                await (externalAccount as any).destroy()
                Alert.alert('Success', `${getProviderName(provider)} account disconnected successfully.`)
                // Reload user to refresh the UI
                await clerkUser.reload()
              }
            } catch (error: any) {
              console.error('Disconnect account error:', error)
              Alert.alert(
                'Error',
                error.errors?.[0]?.longMessage || `Failed to disconnect ${provider} account.`
              )
            }
          }
        }
      ]
    )
  }

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
          
          <TouchableOpacity 
            className="p-2"
            onPress={() => handleDisconnectAccount(account.id, account.provider)}
          >
            <FontAwesome name="unlink" size={16} color="#374151" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  )
} 