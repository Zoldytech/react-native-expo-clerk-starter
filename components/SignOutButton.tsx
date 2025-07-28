import { useAuth } from '@clerk/clerk-expo'
import { router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'

export const SignOutButton = () => {
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.replace('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <TouchableOpacity
      onPress={handleSignOut}
      style={styles.button}
    >
      <Text style={styles.buttonText}>Sign Out</Text>
    </TouchableOpacity>
  )
}

export default SignOutButton

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
}) 