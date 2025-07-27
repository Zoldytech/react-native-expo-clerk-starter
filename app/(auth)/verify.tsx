import React from 'react'
import {
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
  Pressable,
} from 'react-native'
import { useRouter } from 'expo-router'
import FormInput from '@/components/FormInput'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { isClerkAPIResponseError, useSignUp } from '@clerk/clerk-expo'

// Verification validation schema
const verifySchema = z.object({
  code: z.string({ message: 'Verification code is required' }).length(6, 'Code must be 6 digits'),
})

type VerifyFields = z.infer<typeof verifySchema>

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case 'code':
      return 'code'
    default:
      return 'root'
  }
}

export default function VerifyScreen() {
  const router = useRouter()
  
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VerifyFields>({
    resolver: zodResolver(verifySchema),
  })

  const { signUp, isLoaded, setActive } = useSignUp()

  const onVerify = async (data: VerifyFields) => {
    if (!isLoaded) return

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: data.code,
      })

      if (signUpAttempt.status === 'complete') {
        setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/(tabs)')
      } else {
        console.log('Verification failed')
        console.log(signUpAttempt)
        setError('root', { message: 'Could not complete the sign up' })
      }
    } catch (err) {
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
      <View className="flex-1 justify-center px-6">
        <View className="max-w-sm mx-auto w-full">
          <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
            Verify your email
          </Text>
          <Text className="text-center mb-8 text-gray-600 leading-relaxed">
            We sent a verification code to your email address.
            Enter the code below to complete your account setup.
          </Text>

          <FormInput
            control={control}
            name="code"
            placeholder="Enter 6-digit code"
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            autoComplete="one-time-code"
            className="text-center"
          />

          {errors.root && (
            <Text className="text-red-500 text-sm text-center mb-4">
              Verification failed. Please try again.
            </Text>
          )}

          <Pressable 
            onPress={handleSubmit(onVerify)}
            className="bg-blue-500 rounded-lg py-4 items-center mb-4 active:bg-blue-600"
          >
            <Text className="text-white font-semibold">
              Verify
            </Text>
          </Pressable>

          <Pressable 
            onPress={() => console.log('Resend code')}
            className="border border-blue-500 rounded-lg py-4 items-center active:bg-blue-50"
          >
            <Text className="text-blue-500 font-semibold">
              Resend Code
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
} 