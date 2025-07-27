import { SignedIn, SignedOut } from '@clerk/clerk-expo'
import { Redirect, useRouter } from 'expo-router'
import { Text, Pressable, View } from 'react-native'

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <>
      <SignedIn>
        <Redirect href="/(tabs)/home" />
      </SignedIn>
      
      <SignedOut>
        <View className="flex-1 justify-center bg-gray-50 px-6">
          <View className="max-w-sm mx-auto w-full">            
            <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
              Welcome to
            </Text>
            <Text className="text-4xl font-bold text-center mb-8 text-black">
              LinkupSoc
            </Text>
            <Text className="text-center mb-12 text-gray-600 leading-relaxed">
              Connect, share, and discover amazing content with your community.
            </Text>
            
            <Pressable 
              onPress={() => router.push('/(auth)/sign-in')}
              className="bg-black rounded-lg py-4 items-center mb-4 active:opacity-75"
            >
              <Text className="text-white font-semibold">Sign In</Text>
            </Pressable>
            
            <Pressable 
              onPress={() => router.push('/(auth)/sign-up')}
              className="border border-black rounded-lg py-4 items-center active:opacity-75"
            >
              <Text className="font-semibold">Create Account</Text>
            </Pressable>
          </View>
        </View>
      </SignedOut>
    </>
  )
}

