import React, { memo } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'

interface AuthContainerProps {
  children: React.ReactNode
}

// Memoized wrapper component that doesn't re-render when content changes
const AuthContainer = memo(({ children }: AuthContainerProps) => (
  <KeyboardAvoidingView 
    className="flex-1 bg-gray-50"
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    <View className="flex-1 justify-center px-6">
      <View className="w-full">
        {children}
      </View>
    </View>
  </KeyboardAvoidingView>
))

AuthContainer.displayName = 'AuthContainer'

export default AuthContainer 