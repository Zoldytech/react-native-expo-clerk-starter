import { Stack } from 'expo-router'

export default function AuthRoutesLayout() {
  return (
    <Stack 
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    />
  )
}
