import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Text, TouchableOpacity } from 'react-native'

import { isClerkAPIResponseError, useSSO } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'
import * as AuthSession from 'expo-auth-session'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'

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
  const router = useRouter()

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO()

  const onPress = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy,
        // For web, defaults to current path
        // For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
        redirectUrl: AuthSession.makeRedirectUri(),
      })

      // If sign in was successful, set the active session and redirect
      if (createdSessionId) {
        setActive!({ session: createdSessionId })
        router.replace('/(tabs)' as any)
      } else {
        // If there is no `createdSessionId`, check if we have signIn or signUp objects
        // This means the flow started but needs completion
        if (signIn || signUp) {
          Alert.alert(
            'Additional Steps Required',
            'Please complete the additional security steps to continue.',
            [{ text: 'OK' }]
          )
        } else {
          // No session, no signIn/signUp objects - flow was likely cancelled
          console.log('OAuth flow was cancelled or incomplete')
        }
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
        if (err.message.includes('cancelled') || 
            err.message.includes('dismissed') || 
            err.message.includes('user_cancelled')) {
          // User cancelled the OAuth flow, don't show error and don't mark as connected
          console.log('User cancelled OAuth flow')
          setIsLoading(false)
          return
        }
        errorMessage = err.message
      }
      
      // Only show error for actual failures, not cancellations
      Alert.alert(
        `${strategyLabels[strategy]} Sign In Failed`,
        errorMessage,
        [{ text: 'Try Again' }]
      )
    } finally {
      setIsLoading(false)
    }
  }, [strategy, startSSOFlow, isLoading, router])

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
