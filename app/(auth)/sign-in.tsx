import React from 'react'
import {
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
  Pressable,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import FormInput from '@/components/FormInput'
import SignInWith from '@/components/SignInWith'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { isClerkAPIResponseError, useSignIn } from '@clerk/clerk-expo'

// Sign-in validation schema
const signInSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Invalid email'),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password should be at least 8 characters long'),
})

type SignInFields = z.infer<typeof signInSchema>

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case 'identifier':
    case 'email_address':
      return 'email'
    case 'password':
      return 'password'
    default:
      return 'root'
  }
}

export default function SignInScreen() {
  const router = useRouter()
  
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInFields>({
    resolver: zodResolver(signInSchema),
  })

  const { signIn, isLoaded, setActive } = useSignIn()

  const onSignIn = async (data: SignInFields) => {
    if (!isLoaded) return

    try {
      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      })

      if (signInAttempt.status === 'complete') {
        setActive({ session: signInAttempt.createdSessionId })
        router.replace('/(tabs)')
      } else {
        console.log('Sign in failed')
        setError('root', { message: 'Sign in could not be completed' })
      }
    } catch (err) {
      console.error('Sign in error:', JSON.stringify(err, null, 2))

      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          const fieldName = mapClerkErrorToFormField(error)
          setError(fieldName, {
            message: error.longMessage,
          })
        })
      } else {
        setError('root', { message: 'Unknown error' })
      }
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <View className="flex-1 justify-center px-6 max-w-sm mx-auto w-full">
        <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
          Welcome Back
        </Text>
        <Text className="text-base text-center mb-8 text-gray-600">
          Sign in to your account to continue
        </Text>

        <View className="mb-6">
          <FormInput
            control={control}
            name="email"
            placeholder="Email"
            autoFocus
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <FormInput
            control={control}
            name="password"
            placeholder="Password"
            secureTextEntry
            autoComplete="password"
          />

          {errors.root && (
            <Text className="text-red-500 text-sm text-center mt-2">
              Invalid email or password
            </Text>
          )}
        </View>

        <Pressable 
          onPress={handleSubmit(onSignIn)}
          className="bg-blue-500 rounded-lg py-3 px-6 items-center mb-6 active:bg-blue-600"
        >
          <Text className="text-white text-base font-semibold">
            Sign In
          </Text>
        </Pressable>

        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="mx-4 text-gray-600 text-sm">or continue with</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        <View className="flex-row justify-center gap-4 mb-8">
          <SignInWith strategy="oauth_google" />
          <SignInWith strategy="oauth_apple" />
        </View>

        <View className="flex-row justify-center items-center">
          <Text className="text-gray-600 text-sm">Don&apos;t have an account? </Text>
          <Link href="/(auth)/sign-up" className="ml-1">
            <Text className="text-blue-500 text-sm font-semibold">Sign up</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

