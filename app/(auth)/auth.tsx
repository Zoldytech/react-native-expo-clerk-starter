import { useSignIn, useSignUp } from '@clerk/clerk-expo'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native'
import { z } from 'zod'

import FormInput from '@/components/FormInput'
import SignInWith from '@/components/auth/SignInWith'

// Email validation schema
const emailSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Please enter a valid email address'),
})

// Sign-in schema (existing user)
const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password should be at least 8 characters long'),
})

// Sign-up schema (new user)
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password should be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})

// Verification schema
const verificationSchema = z.object({
  code: z.string().min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits'),
})

type EmailFields = z.infer<typeof emailSchema>
type SignInFields = z.infer<typeof signInSchema>
type SignUpFields = z.infer<typeof signUpSchema>
type VerificationFields = z.infer<typeof verificationSchema>

type AuthStep = 'email' | 'signin' | 'signup' | 'verify'

export default function ContinueWithAuth() {
  const router = useRouter()
  const { signIn, isLoaded: signInLoaded, setActive } = useSignIn()
  const { signUp, isLoaded: signUpLoaded, setActive: setActiveSignUp } = useSignUp()
  
  const [authStep, setAuthStep] = useState<AuthStep>('email')
  const [userEmail, setUserEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Email form
  const emailForm = useForm<EmailFields>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  // Sign-in form
  const signInForm = useForm<SignInFields>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  })

  // Sign-up form
  const signUpForm = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', firstName: '', lastName: '' },
    mode: 'onChange',
  })

  // Verification form
  const verificationForm = useForm<VerificationFields>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { code: '' },
  })

  // Clean password fields when transitioning to signin/signup
  useEffect(() => {
    if (authStep === 'signin') {
      console.log('Transitioning to signin, current password value:', signInForm.getValues('password'))
      signInForm.setValue('password', '', { shouldValidate: false })
      console.log('After clearing, password value:', signInForm.getValues('password'))
    } else if (authStep === 'signup') {
      console.log('Transitioning to signup, current password value:', signUpForm.getValues('password'))
      signUpForm.setValue('password', '', { shouldValidate: false })
      console.log('After clearing, password value:', signUpForm.getValues('password'))
    }
  }, [authStep, signInForm, signUpForm])

  const checkUserExists = async (email: string): Promise<boolean> => {
    if (!signInLoaded) return false

    try {
      // Create a temporary sign-in attempt just to check if user exists
      // This should not affect our form state
      const tempSignIn = await signIn.create({
        identifier: email,
      })
      
      // If we get here without error, user exists
      // But we need to clear this attempt to not interfere with our forms
      return true
    } catch (error: any) {
      console.log('User existence check:', error?.errors?.[0]?.code || 'unknown error')
      
      if (error.errors && Array.isArray(error.errors)) {
        const userNotFound = error.errors.some((err: any) => 
          err.code === 'form_identifier_not_found' || 
          err.code === 'form_identifier_exists' ||
          err.message?.toLowerCase().includes('not found') ||
          err.message?.toLowerCase().includes('no account') ||
          err.message?.toLowerCase().includes('invalid')
        )
        
        if (userNotFound) {
          return false
        }
      }
      
      return false
    }
  }

  const handleEmailContinue = async (data: EmailFields) => {
    if (!signInLoaded) {
      Alert.alert('Error', 'Please wait while we load...')
      return
    }

    setIsLoading(true)
    setUserEmail(data.email)

    try {
      const userExists = await checkUserExists(data.email)
      
      if (userExists) {
        // User exists, prepare fresh sign-in form
        signInForm.reset({
          email: data.email,
          password: ''
        })
        // Force update to ensure password field is empty
        signInForm.setValue('password', '')
        setAuthStep('signin')
      } else {
        // User doesn't exist, prepare fresh sign-up form
        signUpForm.reset({
          email: data.email,
          password: '',
          firstName: '',
          lastName: ''
        })
        // Force update to ensure password field is empty
        signUpForm.setValue('password', '')
        setAuthStep('signup')
      }
    } catch (error) {
      console.error('Error in continue flow:', error)
      Alert.alert(
        'Error',
        'Something went wrong. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (data: SignInFields) => {
    if (!signInLoaded) return

    setIsLoading(true)

    try {
      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      })

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/(tabs)' as any)
      } else {
        signInForm.setError('root', { message: 'Sign in could not be completed' })
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err: any) => {
          if (err.meta?.paramName === 'password') {
            signInForm.setError('password', { message: err.longMessage || 'Invalid password' })
          } else {
            signInForm.setError('root', { message: err.longMessage || 'Sign in failed' })
          }
        })
      } else {
        signInForm.setError('root', { message: 'Unknown error occurred' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (data: SignUpFields) => {
    if (!signUpLoaded) return

    setIsLoading(true)

    try {
      const signUpAttempt = await signUp.create({
        emailAddress: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      })

      if (signUpAttempt.status === 'missing_requirements') {
        // Need email verification
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setAuthStep('verify')
      } else if (signUpAttempt.status === 'complete') {
        await setActiveSignUp({ session: signUpAttempt.createdSessionId })
        router.replace('/(tabs)' as any)
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err: any) => {
          const field = err.meta?.paramName || 'root'
          signUpForm.setError(field as any, { message: err.longMessage || err.message })
        })
      } else {
        signUpForm.setError('root', { message: 'Unknown error occurred' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async (data: VerificationFields) => {
    if (!signUpLoaded) return

    setIsLoading(true)

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: data.code,
      })

      if (signUpAttempt.status === 'complete') {
        await setActiveSignUp({ session: signUpAttempt.createdSessionId })
        router.replace('/(tabs)' as any)
      } else {
        verificationForm.setError('code', { message: 'Verification failed. Please try again.' })
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      verificationForm.setError('code', { message: 'Invalid verification code. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const goBack = () => {
    if (authStep === 'signin' || authStep === 'signup') {
      setAuthStep('email')
      setUserEmail('')
      // Reset all forms when going back
      signInForm.reset({ email: '', password: '' })
      signUpForm.reset({ email: '', password: '', firstName: '', lastName: '' })
      emailForm.reset({ email: '' })
    } else if (authStep === 'verify') {
      setAuthStep('signup')
      verificationForm.reset({ code: '' })
    }
  }

  // Email step
  if (authStep === 'email') {
    return (
      <KeyboardAvoidingView 
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6 pt-20">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Continue to your account
            </Text>
            <Text className="text-gray-600 text-lg">
              Sign in or create an account to get started
            </Text>
          </View>

          <View className="mb-6">
            <FormInput
              control={emailForm.control}
              name="email"
              label="Email address"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>

          <TouchableOpacity
            onPress={emailForm.handleSubmit(handleEmailContinue)}
            disabled={isLoading || !signInLoaded}
            className={`w-full py-4 rounded-lg mb-6 ${
              isLoading || !signInLoaded ? 'bg-gray-300' : 'bg-black'
            }`}
          >
            <Text className={`text-center font-semibold ${
              isLoading || !signInLoaded ? 'text-gray-500' : 'text-white'
            }`}>
              {!signInLoaded 
                ? 'Loading...' 
                : isLoading 
                  ? 'Checking...' 
                  : 'Continue'
              }
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-4 text-gray-500 font-medium">OR</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          <View className="mb-8 space-y-3">
            <SignInWith strategy="oauth_google" variant="button" />
            <SignInWith strategy="oauth_apple" variant="button" />
          </View>

          <View className="mt-auto pb-8">
            <View className="flex-row justify-center items-center mb-4">
              <Text className="text-gray-600">Need help? </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text className="text-black font-medium">Reset password</Text>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600">Prefer the classic flow? </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/sign-in')}
              >
                <Text className="text-black font-medium">Sign in here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // Sign-in step (existing user)
  if (authStep === 'signin') {
    return (
      <KeyboardAvoidingView 
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6 pt-20">
          <View className="mb-8">
            <TouchableOpacity onPress={goBack} className="mb-4">
              <Text className="text-gray-600">← Back</Text>
            </TouchableOpacity>
            
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </Text>
            <Text className="text-gray-600 text-lg mb-2">
              Signing in as
            </Text>
            <Text className="text-black font-medium">
              {userEmail}
            </Text>
          </View>

          <View className="mb-6">
            <FormInput
              control={signInForm.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
              autoFocus
              editable={true}
              selectTextOnFocus={true}
              key={`signin-password-${authStep}`}
            />
          </View>

          <TouchableOpacity
            onPress={signInForm.handleSubmit(handleSignIn)}
            disabled={isLoading}
            className={`w-full py-4 rounded-lg mb-4 ${
              isLoading ? 'bg-gray-300' : 'bg-black'
            }`}
          >
            <Text className={`text-center font-semibold ${
              isLoading ? 'text-gray-500' : 'text-white'
            }`}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text className="text-black font-medium">Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // Sign-up step (new user)
  if (authStep === 'signup') {
    return (
      <KeyboardAvoidingView 
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6 pt-20">
          <View className="mb-8">
            <TouchableOpacity onPress={goBack} className="mb-4">
              <Text className="text-gray-600">← Back</Text>
            </TouchableOpacity>
            
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Create your account
            </Text>
            <Text className="text-gray-600 text-lg mb-2">
              Creating account for
            </Text>
            <Text className="text-black font-medium">
              {userEmail}
            </Text>
          </View>

          <View className="space-y-4 mb-6">
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <FormInput
                  control={signUpForm.control}
                  name="firstName"
                  label="First name"
                  placeholder="First name"
                  autoComplete="given-name"
                  autoFocus
                />
              </View>
              <View className="flex-1">
                <FormInput
                  control={signUpForm.control}
                  name="lastName"
                  label="Last name"
                  placeholder="Last name"
                  autoComplete="family-name"
                />
              </View>
            </View>

            <FormInput
              control={signUpForm.control}
              name="password"
              label="Password"
              placeholder="Create a password"
              secureTextEntry
              autoComplete="new-password"
              editable={true}
              selectTextOnFocus={true}
              key={`signup-password-${authStep}`}
            />
          </View>

          <TouchableOpacity
            onPress={signUpForm.handleSubmit(handleSignUp)}
            disabled={isLoading}
            className={`w-full py-4 rounded-lg mb-4 ${
              isLoading ? 'bg-gray-300' : 'bg-black'
            }`}
          >
            <Text className={`text-center font-semibold ${
              isLoading ? 'text-gray-500' : 'text-white'
            }`}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <Text className="text-center text-gray-600 text-sm">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // Verification step
  if (authStep === 'verify') {
    return (
      <KeyboardAvoidingView 
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6 pt-20">
          <View className="mb-8">
            <TouchableOpacity onPress={goBack} className="mb-4">
              <Text className="text-gray-600">← Back</Text>
            </TouchableOpacity>
            
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Verify your email
            </Text>
            <Text className="text-gray-600 text-lg">
              We sent a verification code to {userEmail}
            </Text>
          </View>

          <View className="mb-6">
            <FormInput
              control={verificationForm.control}
              name="code"
              label="Verification code"
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
              autoFocus
            />
          </View>

          <TouchableOpacity
            onPress={verificationForm.handleSubmit(handleVerification)}
            disabled={isLoading}
            className={`w-full py-4 rounded-lg mb-4 ${
              isLoading ? 'bg-gray-300' : 'bg-black'
            }`}
          >
            <Text className={`text-center font-semibold ${
              isLoading ? 'text-gray-500' : 'text-white'
            }`}>
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => signUp?.prepareEmailAddressVerification({ strategy: 'email_code' })}
            disabled={isLoading}
          >
            <Text className="text-center text-black font-medium">
              Resend code
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return null
} 