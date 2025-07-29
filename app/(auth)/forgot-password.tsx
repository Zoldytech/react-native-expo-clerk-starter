import React from 'react'
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

import { isClerkAPIResponseError, useSignIn } from '@clerk/clerk-expo'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import FormInput from '@/components/FormInput'

// Forgot password validation schema
const forgotPasswordSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Invalid email'),
})

type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordScreen() {
  const router = useRouter()
  
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const { signIn, isLoaded } = useSignIn()

  const onSendReset = async (data: ForgotPasswordFields) => {
    if (!isLoaded || !signIn) return

    try {
      // Send password reset email
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: data.email,
      })

      // Navigate to reset password screen or show success message
      // For now, just go back to sign in
      router.replace('/(auth)/sign-in' as any)
    } catch (err) {
      console.error('Password reset error:', JSON.stringify(err, null, 2))
      
      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          if (error.meta?.paramName === 'identifier') {
            setError('email', {
              message: error.longMessage || error.message,
            })
          } else {
            setError('root', { message: error.longMessage || error.message })
          }
        })
      } else {
        setError('root', { message: 'Failed to send reset email' })
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
            Reset Password
          </Text>
          <Text className="text-center mb-8 text-gray-600">
            Enter your email to receive a password reset link
          </Text>

          <View className="mb-4">
            <FormInput
              control={control}
              name="email"
              placeholder="Email"
              autoFocus
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          {errors.root && (
            <Text className="text-red-500 text-sm text-center mb-4">
              {errors.root.message}
            </Text>
          )}

          <TouchableOpacity 
            onPress={handleSubmit(onSendReset)}
            className="bg-black rounded-lg py-4 items-center mb-6"
          >
            <Text className="text-white font-semibold">
              Send Reset Link
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-gray-600 text-sm">Remember your password? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in' as any)}>
              <Text className="text-sm font-semibold">Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
} 