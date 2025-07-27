import { useAuth } from '@clerk/clerk-expo'
import { Redirect, Stack } from 'expo-router'

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth()

  if (isSignedIn) {
    return <Redirect href={'/(tabs)'} />
  }

  return (
    <Stack 
      screenOptions={{
        headerShown: false,
        animation: 'none', // Disable animations to prevent visual glitches during replace
      }}
    >
      <Stack.Screen 
        name="sign-in" 
        options={{ 
          title: 'Sign In',
        }} 
      />
      <Stack.Screen 
        name="sign-up" 
        options={{ 
          title: 'Sign Up',
        }} 
      />
      <Stack.Screen 
        name="verify" 
        options={{ 
          title: 'Verify Email',
        }} 
      />
    </Stack>
  )
}
