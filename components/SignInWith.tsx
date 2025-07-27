import React, { useEffect, useCallback } from 'react'
import { Pressable, Image } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { useSSO } from '@clerk/clerk-expo'

// Import social provider icons
const googleIcon = require('../assets/images/social-providers/google.png')
const appleIcon = require('../assets/images/social-providers/apple.png')

type SignInWithProps = {
  strategy: 'oauth_google' | 'oauth_apple'
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
  oauth_google: googleIcon,
  oauth_apple: appleIcon,
}

export default function SignInWith({ strategy }: SignInWithProps) {
  useWarmUpBrowser()

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO()

  const onPress = useCallback(async () => {
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
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error('OAuth error:', JSON.stringify(err, null, 2))
    }
  }, [strategy, startSSOFlow])

  return (
    <Pressable 
      onPress={onPress} 
      className="w-15 h-15 items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm active:scale-95"
    >
      <Image
        source={strategyIcons[strategy]}
        className="w-8 h-8"
        resizeMode="contain"
      />
    </Pressable>
  )
} 