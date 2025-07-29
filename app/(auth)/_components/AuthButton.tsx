import React from 'react'
import { Text, TouchableOpacity } from 'react-native'

interface AuthButtonProps {
  onPress: () => void
  title: string
  disabled?: boolean
  loading?: boolean
  loadingText?: string
}

export default function AuthButton({ 
  onPress, 
  title, 
  disabled = false, 
  loading = false, 
  loadingText 
}: AuthButtonProps) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`rounded-lg py-4 items-center mb-6 ${
        isDisabled ? 'bg-gray-300' : 'bg-black'
      }`}
    >
      <Text className={`font-semibold ${
        isDisabled ? 'text-gray-500' : 'text-white'
      }`}>
        {loading && loadingText ? loadingText : title}
      </Text>
    </TouchableOpacity>
  )
} 