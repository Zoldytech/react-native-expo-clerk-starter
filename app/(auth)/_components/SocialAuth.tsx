import SignInWith from '@/components/auth/SignInWith'
import React from 'react'
import { Text, View } from 'react-native'

export default function SocialAuth() {
  return (
    <>
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1">
          <SignInWith strategy="oauth_google" variant="button" />
        </View>
        <View className="flex-1">
          <SignInWith strategy="oauth_apple" variant="button" />
        </View>
      </View>

      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="mx-4 text-gray-600 text-sm">or</Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>
    </>
  )
} 