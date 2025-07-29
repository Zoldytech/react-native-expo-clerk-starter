import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface AuthLinkProps {
  onPress: () => void
  text: string
  align?: 'left' | 'center' | 'right'
}

export default function AuthLink({ onPress, text, align = 'center' }: AuthLinkProps) {
  const alignmentClass = {
    left: 'justify-start',
    center: 'justify-center', 
    right: 'justify-end'
  }[align]

  return (
    <View className={`flex-row ${alignmentClass}`}>
      <TouchableOpacity onPress={onPress}>
        <Text className="text-sm font-semibold">{text}</Text>
      </TouchableOpacity>
    </View>
  )
} 