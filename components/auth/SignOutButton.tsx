import React from 'react'
import { TouchableOpacity, Text, Alert } from 'react-native'

import { useRouter } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'

const SignOutButton = () => {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      // Show confirmation dialog
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                // Clear Clerk session completely
                await signOut()
                
                // Reset the entire navigation stack and go to welcome
                router.dismissAll()
              } catch (error) {
                console.error('Error during sign out:', error)
                Alert.alert(
                  'Sign Out Failed', 
                  'There was an error signing you out. Please try again.'
                )
              }
            },
          },
        ],
        { cancelable: true }
      )
    } catch (error) {
      console.error('Error showing sign out dialog:', error)
    }
  }

  return (
    <TouchableOpacity 
      onPress={handleSignOut}
      className="bg-red-500 rounded-lg py-3 px-6 mt-5"
    >
      <Text className="text-white font-semibold text-center">
        Sign Out
      </Text>
    </TouchableOpacity>
  )
}

export default SignOutButton
