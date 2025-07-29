import { useSignIn, useSignUp } from '@clerk/clerk-expo'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import { z } from 'zod'

import FormInput from '@/components/FormInput'
import { WEB_URL_PRIVACY, WEB_URL_TERMS } from '@/constants/Config'
import AuthBackButton from './_components/AuthBackButton'
import AuthButton from './_components/AuthButton'
import AuthContainer from './_components/AuthContainer'
import AuthHeader from './_components/AuthHeader'
import AuthLink from './_components/AuthLink'
import SocialAuth from './_components/SocialAuth'

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
      // Silently handle error
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
      // Silently handle error
    }
  }

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
      signInForm.setValue('password', '', { shouldValidate: false })
    } else if (authStep === 'signup') {
      signUpForm.setValue('password', '', { shouldValidate: false })
    }
  }, [authStep, signInForm, signUpForm])

  const checkUserExists = async (email: string): Promise<boolean> => {
    if (!signInLoaded) return false

    try {
      await signIn.create({
        identifier: email,
      })
      return true
    } catch (error: any) {
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
        signInForm.reset({
          email: data.email,
          password: ''
        })
        signInForm.setValue('password', '')
        setAuthStep('signin')
      } else {
        signUpForm.reset({
          email: data.email,
          password: '',
          firstName: '',
          lastName: ''
        })
        signUpForm.setValue('password', '')
        setAuthStep('signup')
      }
    } catch (error) {
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
        router.replace('/(tabs)/home' as any)
      } else {
        signInForm.setError('root', { message: 'Sign in could not be completed' })
      }
    } catch (error: any) {
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
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setAuthStep('verify')
      } else if (signUpAttempt.status === 'complete') {
        await setActiveSignUp({ session: signUpAttempt.createdSessionId })
        router.replace('/(tabs)/home' as any)
      }
    } catch (error: any) {
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
        router.replace('/(tabs)/home' as any)
      } else {
        verificationForm.setError('code', { message: 'Verification failed. Please try again.' })
      }
    } catch (error: any) {
      verificationForm.setError('code', { message: 'Invalid verification code. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const goBack = () => {
    if (authStep === 'signin' || authStep === 'signup') {
      setAuthStep('email')
      setUserEmail('')
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
      <AuthContainer>
        <View className="w-full">
          <AuthHeader
            title="Continue to your account"
            subtitle="Sign in or create an account to get started"
          />

          <SocialAuth />

          <View className="mb-4">
            <FormInput
              control={emailForm.control}
              name="email"
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              autoFocus
            />
          </View>

          <AuthButton
            title={!signInLoaded 
              ? 'Loading...' 
              : isLoading 
                ? 'Checking...' 
                : 'Continue'}
            onPress={emailForm.handleSubmit(handleEmailContinue)}
            disabled={isLoading || !signInLoaded}
            loading={isLoading}
            loadingText={!signInLoaded ? 'Loading...' : 'Checking...'}
          />

          <AuthLink
            text="Forgot password?"
            onPress={() => router.push('/(auth)/forgot-password')}
            align="right"
          />
        </View>
      </AuthContainer>
    )
  }

  // Sign-in step (existing user)
  if (authStep === 'signin') {
    return (
      <AuthContainer>
        <View className="w-full">
          <AuthBackButton onPress={goBack} />
          
          <AuthHeader
            title="Welcome back"
            emailLabel="Signing in as"
            email={userEmail}
          />

          <View className="mb-4">
            <FormInput
              control={signInForm.control}
              name="password"
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
              autoFocus
              editable={true}
              selectTextOnFocus={true}
              key={`signin-password-${authStep}`}
            />
          </View>

          <AuthButton
            title={isLoading ? 'Signing in...' : 'Sign In'}
            onPress={signInForm.handleSubmit(handleSignIn)}
            disabled={isLoading}
            loading={isLoading}
            loadingText="Signing in..."
          />

          <AuthLink
            text="Forgot password?"
            onPress={() => router.push('/(auth)/forgot-password')}
            align="right"
          />
        </View>
      </AuthContainer>
    )
  }

  // Sign-up step (new user)
  if (authStep === 'signup') {
    return (
      <AuthContainer>
        <View className="w-full">
          <AuthBackButton onPress={goBack} />
          
          <AuthHeader
            title="Create your account"
            emailLabel="Creating account for"
            email={userEmail}
          />

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <FormInput
                control={signUpForm.control}
                name="firstName"
                placeholder="First name"
                autoComplete="given-name"
                autoCapitalize="words"
                autoFocus
              />
            </View>
            <View className="flex-1">
              <FormInput
                control={signUpForm.control}
                name="lastName"
                placeholder="Last name"
                autoComplete="family-name"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View className="mb-4">
            <FormInput
              control={signUpForm.control}
              name="password"
              placeholder="Create a password"
              secureTextEntry
              autoComplete="new-password"
              editable={true}
              selectTextOnFocus={true}
              key={`signup-password-${authStep}`}
            />
          </View>

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

          <AuthButton
            title={isLoading ? 'Creating account...' : 'Create Account'}
            onPress={signUpForm.handleSubmit(handleSignUp)}
            disabled={isLoading}
            loading={isLoading}
            loadingText="Creating account..."
          />
        </View>
      </AuthContainer>
    )
  }

  // Verification step
  if (authStep === 'verify') {
    return (
      <AuthContainer>
        <View className="w-full">
          <AuthBackButton onPress={goBack} />
          
          <AuthHeader
            title="Verify your email"
            subtitle={`We sent a verification code to ${userEmail}`}
          />

          <View className="mb-4">
            <FormInput
              control={verificationForm.control}
              name="code"
              placeholder="Enter verification code"
              keyboardType="number-pad"
              autoFocus
              maxLength={6}
              autoComplete="one-time-code"
            />
          </View>

          <AuthButton
            title={isLoading ? 'Verifying...' : 'Verify Email'}
            onPress={verificationForm.handleSubmit(handleVerification)}
            disabled={isLoading}
            loading={isLoading}
            loadingText="Verifying..."
          />

          <View className="flex-row justify-center">
            <Text className="text-gray-600 text-sm">Didn&apos;t receive a code? </Text>
            <TouchableOpacity
              onPress={() => signUp?.prepareEmailAddressVerification({ strategy: 'email_code' })}
              disabled={isLoading}
            >
              <Text className="text-sm font-semibold">Resend code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AuthContainer>
    )
  }

  return null
} 