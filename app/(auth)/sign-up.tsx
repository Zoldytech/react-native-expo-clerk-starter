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
import { isClerkAPIResponseError, useSignUp } from '@clerk/clerk-expo'

// Sign-up validation schema
const signUpSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Invalid email'),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password should be at least 8 characters long'),
})

type SignUpFields = z.infer<typeof signUpSchema>

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case 'email_address':
      return 'email'
    case 'password':
      return 'password'
    default:
      return 'root'
  }
}

export default function SignUpScreen() {
  const router = useRouter()
  
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
  })

  const { signUp, isLoaded } = useSignUp()

  const onSignUp = async (data: SignUpFields) => {
    if (!isLoaded) return

    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      router.push('/(auth)/verify')
    } catch (err) {
      console.log('Sign up error:', err)
      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          console.log('Error:', JSON.stringify(error, null, 2))
          const fieldName = mapClerkErrorToFormField(error)
          console.log('Field name:', fieldName)
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
          Create Account
        </Text>
        <Text className="text-base text-center mb-8 text-gray-600">
          Join our community today
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
            autoComplete="new-password"
          />

          {errors.root && (
            <Text className="text-red-500 text-sm text-center mt-2">
              Failed to create account
            </Text>
          )}
        </View>

        <Pressable 
          onPress={handleSubmit(onSignUp)}
          className="bg-blue-500 rounded-lg py-3 px-6 items-center mb-6 active:bg-blue-600"
        >
          <Text className="text-white text-base font-semibold">
            Create Account
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
          <Text className="text-gray-600 text-sm">Already have an account? </Text>
          <Link href="/(auth)/sign-in" className="ml-1">
            <Text className="text-blue-500 text-sm font-semibold">Sign in</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

