import React from 'react'
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

import { isClerkAPIResponseError, useSignUp } from '@clerk/clerk-expo'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import FormInput from '@/components/FormInput'

// Verification validation schema
const verifySchema = z.object({
  code: z.string({ message: 'Verification code is required' }).min(6, 'Code must be 6 digits'),
})

type VerifyFields = z.infer<typeof verifySchema>

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
    if (!isLoaded || !signUp) return

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: data.code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/(tabs)' as any)
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2))
        setError('root', { message: 'Verification failed. Please try again.' })
      }
    } catch (err) {
      console.error('Verification error:', JSON.stringify(err, null, 2))
      
      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          if (error.code === 'verification_failed') {
            setError('code', {
              message: 'Invalid verification code. Please try again.',
            })
          } else {
            setError('root', { message: error.longMessage || error.message })
          }
        })
      } else {
        setError('root', { message: 'Unknown error occurred' })
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
            Verify Your Email
          </Text>
          <Text className="text-center mb-8 text-gray-600">
            We sent a verification code to your email address
          </Text>

          <View className="mb-4">
            <FormInput
              control={control}
              name="code"
              placeholder="Enter verification code"
              autoFocus
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
            />
          </View>

          {errors.root && (
            <Text className="text-red-500 text-sm text-center mb-4">
              {errors.root.message}
            </Text>
          )}

          <TouchableOpacity 
            onPress={handleSubmit(onVerify)}
            className="bg-black rounded-lg py-4 items-center mb-6"
          >
            <Text className="text-white font-semibold">
              Verify Email
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-gray-600 text-sm">Didn&apos;t receive a code? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-sm font-semibold">Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
