import React, { useEffect, useCallback, useState } from 'react'
import { TouchableOpacity, Text, Alert } from 'react-native'

import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { useSSO, isClerkAPIResponseError } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'

type SignInWithProps = {
  strategy: 'oauth_google' | 'oauth_apple'
  variant?: 'icon' | 'button'
}

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync()
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync()
    }
  }, [])
}

const strategyIcons = {
  oauth_google: 'google' as const,
  oauth_apple: 'apple' as const,
}

const strategyLabels = {
  oauth_google: 'Google',
  oauth_apple: 'Apple',
}

export default function SignInWith({ strategy, variant = 'icon' }: SignInWithProps) {
  useWarmUpBrowser()
  const [isLoading, setIsLoading] = useState(false)

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO()

  const onPress = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive } =
        await startSSOFlow({
          strategy,
          // For web, defaults to current path
          // For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
          redirectUrl: AuthSession.makeRedirectUri(),
        })

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({ session: createdSessionId })
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        // Use the `signIn` or `signUp` returned from `startSSOFlow`
        // to handle next steps
        Alert.alert(
          'Additional Steps Required',
          'Please complete the additional security steps to continue.',
          [{ text: 'OK' }]
        )
      }
    } catch (err) {
      console.error('OAuth error:', JSON.stringify(err, null, 2))
      
      let errorMessage = 'Something went wrong. Please try again.'
      
      if (isClerkAPIResponseError(err)) {
        // Handle specific Clerk errors
        const firstError = err.errors[0]
        if (firstError) {
          errorMessage = firstError.longMessage || firstError.message
        }
      } else if (err instanceof Error) {
        // Handle general errors
        if (err.message.includes('cancelled') || err.message.includes('dismissed')) {
          // User cancelled the OAuth flow, don't show error
          return
        }
        errorMessage = err.message
      }
      
      Alert.alert(
        `${strategyLabels[strategy]} Sign In Failed`,
        errorMessage,
        [{ text: 'Try Again' }]
      )
    } finally {
      setIsLoading(false)
    }
  }, [strategy, startSSOFlow, isLoading])

  if (variant === 'button') {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        disabled={isLoading}
        className={`flex-row items-center justify-center bg-white border border-gray-300 rounded-lg py-3 px-4 ${
          isLoading ? 'opacity-50' : ''
        }`}
      >
        <FontAwesome
          name={strategyIcons[strategy]}
          size={20}
          color="#374151"
          style={{ marginRight: 12 }}
        />
        <Text className="text-gray-700 font-medium">
          {isLoading ? 'Signing in...' : strategyLabels[strategy]}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={isLoading}
      className={`w-16 h-16 items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm ${
        isLoading ? 'opacity-50' : ''
      }`}
    >
      <FontAwesome
        name={strategyIcons[strategy]}
        size={32}
        color="#374151"
      />
    </TouchableOpacity>
  )
}
