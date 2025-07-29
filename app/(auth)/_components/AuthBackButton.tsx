import React from 'react'
import { Text, TouchableOpacity } from 'react-native'

interface AuthBackButtonProps {
  onPress: () => void
}

export default function AuthBackButton({ onPress }: AuthBackButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} className="mb-4">
      <Text className="text-gray-600">← Back</Text>
    </TouchableOpacity>
  )
} 