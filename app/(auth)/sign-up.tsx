import React from 'react'
import {
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
  Pressable,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import FormInput from '@/components/FormInput'
import SignInWith from '@/components/auth/SignInWith'
import { WEB_URL_TERMS, WEB_URL_PRIVACY } from '@/constants/Config'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { isClerkAPIResponseError, useSignUp } from '@clerk/clerk-expo'

// Sign-up validation schema
const signUpSchema = z.object({
  firstName: z.string({ message: 'First name is required' }).min(1, 'First name is required'),
  lastName: z.string({ message: 'Last name is required' }).min(1, 'Last name is required'),
  email: z.string({ message: 'Email is required' }).email('Invalid email'),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password should be at least 8 characters long'),
})

type SignUpFields = z.infer<typeof signUpSchema>

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case 'first_name':
      return 'firstName'
    case 'last_name':
      return 'lastName'
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

  const openTerms = async () => {
    try {
      await WebBrowser.openBrowserAsync(WEB_URL_TERMS, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: '#3B82F6',
        readerMode: false,
        showTitle: true,
        enableBarCollapsing: false,
      })
    } catch (error) {
      console.error('Error opening Terms of Service:', error)
    }
  }

  const openPrivacy = async () => {
    try {
      await WebBrowser.openBrowserAsync(WEB_URL_PRIVACY, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: '#3B82F6',
        readerMode: false,
        showTitle: true,
        enableBarCollapsing: false,
      })
    } catch (error) {
      console.error('Error opening Privacy Policy:', error)
    }
  }

  const onSignUp = async (data: SignUpFields) => {
    if (!isLoaded) return

    try {
      await signUp.create({
        firstName: data.firstName,
        lastName: data.lastName,
        emailAddress: data.email,
        password: data.password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      router.replace('/(auth)/verify')
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
      <View className="flex-1 justify-center px-6">
        <View className="max-w-sm mx-auto w-full">
          <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
            Create Account
          </Text>
          <Text className="text-center mb-8 text-gray-600">
            Join our community today
          </Text>

          <View className="flex-row gap-3 mb-6">
            <View className="flex-1">
              <SignInWith strategy="oauth_google" variant="button" />
            </View>
            <View className="flex-1">
              <SignInWith strategy="oauth_apple" variant="button" />
            </View>
          </View>

          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-4 text-gray-600 text-sm">or</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <FormInput
                control={control}
                name="firstName"
                placeholder="First name"
                autoFocus
                autoCapitalize="words"
                autoComplete="given-name"
              />
            </View>
            <View className="flex-1">
              <FormInput
                control={control}
                name="lastName"
                placeholder="Last name"
                autoCapitalize="words"
                autoComplete="family-name"
              />
            </View>
          </View>

          <View className="mb-4">
            <FormInput
              control={control}
              name="email"
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View className="mb-4">
            <FormInput
              control={control}
              name="password"
              placeholder="Password"
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          {errors.root && (
            <Text className="text-red-500 text-sm text-center mb-4">
              Failed to create account
            </Text>
          )}

          <View className="mb-4">
            <Text className="text-xs text-gray-600 text-center leading-relaxed">
              By continuing, you agree to our{' '}
              <Text 
                className="underline" 
                onPress={openTerms}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text 
                className="underline" 
                onPress={openPrivacy}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>

          <Pressable 
            onPress={handleSubmit(onSignUp)}
            className="bg-black rounded-lg py-4 items-center mb-6 active:opacity-75"
          >
            <Text className="text-white font-semibold">
              Create Account
            </Text>
          </Pressable>

          <View className="flex-row justify-center">
            <Text className="text-gray-600 text-sm">Already have an account? </Text>
            <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
              <Text className="text-sm font-semibold">Sign in</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

