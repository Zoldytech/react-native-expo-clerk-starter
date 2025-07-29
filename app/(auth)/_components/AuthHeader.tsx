import React from 'react'
import { Text, View } from 'react-native'

interface AuthHeaderProps {
  title: string
  subtitle?: string
  email?: string
  emailLabel?: string
}

export default function AuthHeader({ title, subtitle, email, emailLabel }: AuthHeaderProps) {
  return (
    <View className="mb-8">
      <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-center mb-2 text-gray-600">
          {subtitle}
        </Text>
      )}
      {email && (
        <>
          {emailLabel && (
            <Text className="text-center mb-2 text-gray-600">
              {emailLabel}
            </Text>
          )}
          <Text className="text-center text-black font-medium">
            {email}
          </Text>
        </>
      )}
    </View>
  )
} 