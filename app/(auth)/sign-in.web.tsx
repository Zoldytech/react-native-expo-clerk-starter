import { SignIn } from '@clerk/clerk-expo/web'

export default function SignInPage() {
  return (
    <SignIn 
      fallbackRedirectUrl="/"
      signUpUrl="/(auth)/sign-up"
    />
  )
} 