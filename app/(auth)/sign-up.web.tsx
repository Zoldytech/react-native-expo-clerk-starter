import { SignUp } from '@clerk/clerk-expo/web'

export default function SignUpPage() {
  return (
    <SignUp 
      fallbackRedirectUrl="/"
      signInUrl="/(auth)/sign-in"
    />
  )
} 