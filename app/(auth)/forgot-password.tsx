import React, { useState } from 'react'
import {
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
  Pressable,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import FormInput from '@/components/FormInput'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { isClerkAPIResponseError, useSignIn } from '@clerk/clerk-expo'

// Forgot password validation schema
const forgotPasswordSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Invalid email'),
})

type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>

// Reset password validation schema
const resetPasswordSchema = z.object({
  code: z
    .string({ message: 'Code is required' })
    .length(6, 'Code must be 6 digits'),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password should be at least 8 characters long'),
  confirmPassword: z
    .string({ message: 'Confirm password is required' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don&apos;t match",
  path: ["confirmPassword"],
})

type ResetPasswordFields = z.infer<typeof resetPasswordSchema>

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [isLoading, setIsLoading] = useState(false)

  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    setError: setEmailError,
    formState: { errors: emailErrors },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const {
    control: resetControl,
    handleSubmit: handleResetSubmit,
    setError: setResetError,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const { signIn, isLoaded } = useSignIn()

  const onSendResetEmail = async (data: ForgotPasswordFields) => {
    if (!isLoaded) return
    setIsLoading(true)

    try {
      const firstFactor = await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: data.email,
      })

      if (firstFactor.status === 'needs_first_factor') {
        setStep('reset')
      }
    } catch (err) {
      console.error('Reset email error:', JSON.stringify(err, null, 2))

      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          if (error.meta?.paramName === 'identifier' || error.meta?.paramName === 'email_address') {
            setEmailError('email', { message: error.longMessage })
          } else {
            setEmailError('root', { message: error.longMessage })
          }
        })
      } else {
        setEmailError('root', { message: 'Failed to send reset email. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onResetPassword = async (data: ResetPasswordFields) => {
    if (!isLoaded) return
    setIsLoading(true)

    try {
      const resetAttempt = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: data.code,
        password: data.password,
      })

      if (resetAttempt.status === 'complete') {
        Alert.alert(
          'Password Reset Successful',
          'Your password has been successfully reset. You can now sign in with your new password.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/sign-in'),
            },
          ]
        )
      } else {
        setResetError('root', { message: 'Password reset could not be completed' })
      }
    } catch (err) {
      console.error('Password reset error:', JSON.stringify(err, null, 2))

      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          if (error.meta?.paramName === 'code') {
            setResetError('code', { message: error.longMessage })
          } else if (error.meta?.paramName === 'password') {
            setResetError('password', { message: error.longMessage })
          } else {
            setResetError('root', { message: error.longMessage })
          }
        })
      } else {
        setResetError('root', { message: 'Password reset failed. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'email') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-50"
      >
        <View className="flex-1 justify-center px-6">
          <View className="max-w-sm mx-auto w-full">
            <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
              Forgot Password?
            </Text>
            <Text className="text-center mb-8 text-gray-600">
              Enter your email address and we&apos;ll send you a code to reset your password.
            </Text>

            <View className="mb-6">
              <FormInput
                control={emailControl}
                name="email"
                placeholder="Email"
                autoFocus
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {emailErrors.root && (
              <Text className="text-red-500 text-sm text-center mb-4">
                {emailErrors.root.message}
              </Text>
            )}

            <Pressable 
              onPress={handleEmailSubmit(onSendResetEmail)}
              disabled={isLoading}
              className={`rounded-lg py-4 items-center mb-6 ${
                isLoading ? 'bg-black opacity-75' : 'bg-black'
              }`}
            >
              <Text className="text-white font-semibold">
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </Text>
            </Pressable>

            <View className="flex-row justify-center">
              <Text className="text-gray-600 text-sm">Remember your password? </Text>
              <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
                <Text className="text-sm font-semibold">Sign in</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    )
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
            Enter the 6-digit code sent to your email and your new password.
          </Text>

          <View className="mb-4">
            <FormInput
              control={resetControl}
              name="code"
              placeholder="6-digit code"
              autoFocus
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <View className="mb-4">
            <FormInput
              control={resetControl}
              name="password"
              placeholder="New Password"
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <View className="mb-6">
            <FormInput
              control={resetControl}
              name="confirmPassword"
              placeholder="Confirm New Password"
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          {resetErrors.root && (
            <Text className="text-red-500 text-sm text-center mb-4">
              {resetErrors.root.message}
            </Text>
          )}

          <Pressable 
            onPress={handleResetSubmit(onResetPassword)}
            disabled={isLoading}
            className={`rounded-lg py-4 items-center mb-6 ${
              isLoading ? 'bg-black' : 'bg-black active:opacity-75'
            }`}
          >
            <Text className="text-white font-semibold">
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Text>
          </Pressable>

          <View className="flex-row justify-center">
            <Pressable onPress={() => setStep('email')}>
              <Text className="text-sm font-semibold">
                ← Back to email
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
} 