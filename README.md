# React Native Expo Clerk Starter

A **production-ready** React Native starter template with **comprehensive authentication**, **user profile management**, and **modern UI/UX** - built with Expo, Clerk, and NativeWind.

## ✨ What's Included

This starter provides a **complete authentication and user management system** that you can use as a foundation for your React Native apps. Everything is **type-safe**, **thoroughly tested**, and follows **modern best practices**.

### 🔐 **Complete Authentication System**
- **Unified "Continue with..." Flow** - Modern single-page auth (like lu.ma)
- **Email/Password Authentication** with proper validation
- **Social OAuth** - Google & Apple (with proper error handling)
- **Email Verification** with resend functionality
- **Password Reset** flow
- **Type-safe Forms** with React Hook Form + Zod validation

### 👤 **User Profile Management**
- **Profile Settings** with image upload
- **Username Editing** with validation
- **Email Management** - Add, verify, delete multiple emails
- **Phone Number Management** - Add, verify, delete phone numbers
- **Connected Accounts** - Link/unlink Google, Apple accounts
- **Security Settings** - Password change, 2FA setup, passkey support

### 🔒 **Security Features**
- **Passkey Support** (when available in Clerk SDK)
- **Two-Factor Authentication** setup (TOTP)
- **Secure Token Storage** with expo-secure-store
- **Proper Error Handling** with user-friendly messages
- **OAuth Security** - Proper cleanup on cancellation/failure

### 🎨 **Modern UI/UX**
- **NativeWind** - Tailwind CSS for React Native
- **Reusable Components** - DRY principle, no code duplication
- **Responsive Design** - Works on all screen sizes
- **Loading States** - Proper UI feedback for all actions
- **Platform-specific Components** - iOS and Web optimizations

### 🛡️ **Type Safety**
- **100% TypeScript** - No `any` types in production code
- **Clerk Type Integration** - Proper typing for all Clerk resources
- **Form Validation** - Runtime + compile-time type checking
- **Error Type Guards** - Safe error handling patterns

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Expo CLI
- [Clerk Account](https://clerk.com) (free tier available)

### 1. Clone & Install
```bash
git clone <your-repo>
cd mobile-app
npm install
```

### 2. Environment Setup
Create a `.env` file:
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
```

### 3. Clerk Configuration
1. Create a new Clerk application
2. Enable **Email** and **OAuth providers** (Google, Apple)
3. Configure OAuth redirect URLs:
   - Development: `exp://127.0.0.1:19000/--/oauth-callback`
   - Production: Your app's deep link scheme

### 4. Start Development
```bash
npx expo start
```

## 📱 Authentication Flows

### **Unified Continue Flow** (`/continue`)
Modern single-page authentication similar to lu.ma:
1. **Email Entry** - User enters email
2. **Smart Routing** - Automatically detects existing users
3. **Sign In** - Existing users enter password
4. **Sign Up** - New users complete profile (name + password)
5. **Verification** - Email verification when needed

### **Classic Flows** (Still Available)
- **Sign In** (`/sign-in`) - Traditional email/password
- **Sign Up** (`/sign-up`) - Traditional registration
- **Verification** (`/verify`) - Email verification
- **Forgot Password** (`/forgot-password`) - Password reset

### **Profile Management**
Complete user profile system accessible after authentication:
- **Profile Details** - Name, username, profile image
- **Email Management** - Multiple emails, verification
- **Phone Management** - Add/remove phone numbers
- **Connected Accounts** - OAuth account linking
- **Security Settings** - Password, 2FA, passkeys

## 🏗️ Project Structure

```
mobile-app/
├── app/
│   ├── (auth)/                    # Authentication screens
│   │   ├── _components/           # Shared auth components
│   │   │   └── AuthContainer.tsx  # Layout wrapper
│   │   ├── continue.tsx           # Unified auth flow ⭐
│   │   ├── sign-in.tsx           # Classic sign in
│   │   ├── sign-up.tsx           # Classic sign up
│   │   ├── verify.tsx            # Email verification
│   │   └── forgot-password.tsx   # Password reset
│   ├── (tabs)/                   # Main app (protected)
│   │   ├── index.tsx             # Home tab
│   │   ├── explore.tsx           # Explore tab
│   │   └── profile/              # Profile management
│   │       ├── index.tsx         # Profile overview
│   │       └── settings.tsx      # Profile settings
│   ├── index.tsx                 # Welcome/landing screen
│   └── _layout.tsx               # Root layout + Clerk provider
├── components/
│   ├── auth/
│   │   ├── SignInWith.tsx        # Social auth buttons
│   │   ├── SignOutButton.tsx     # Sign out functionality
│   │   └── UserProfileSettings/  # Complete profile system
│   │       ├── ProfileSection.tsx      # Main profile component
│   │       ├── SecuritySection.tsx     # Security settings
│   │       └── components/             # Sub-components
│   │           ├── ProfileHeader.tsx   # Profile image/name
│   │           ├── EmailManagement.tsx # Email management
│   │           ├── PhoneManagement.tsx # Phone management
│   │           └── ConnectedAccounts.tsx # OAuth accounts
│   ├── FormInput.tsx             # Type-safe form input
│   └── ui/                       # UI components
├── constants/
│   ├── Colors.ts                 # Theme colors
│   └── Config.ts                 # App configuration
└── hooks/
    ├── useColorScheme.ts         # Theme detection
    └── useThemeColor.ts          # Color theming
```

## 🎯 Key Features Explained

### **Type-Safe Authentication**
All forms use **React Hook Form + Zod** for validation:
```typescript
const signInSchema = z.object({
  identifier: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password should be at least 8 characters long'),
})
```

### **Error Handling Pattern**
Consistent error handling across all components:
```typescript
catch (error: unknown) {
  if (isClerkAPIResponseError(error)) {
    const message = error.errors?.[0]?.longMessage || 'Default message'
    Alert.alert('Error', message)
  } else {
    Alert.alert('Error', 'Something went wrong')
  }
}
```

### **OAuth Integration**
Proper OAuth implementation with cleanup:
```typescript
// Dynamic redirect URI generation
const redirectUri = AuthSession.makeRedirectUri()

// Proper cleanup on cancellation
if (result.type === 'cancel') {
  await externalAccount.destroy() // Clean up pending connection
}
```

### **Reusable Components**
DRY principle with reusable, type-safe components:
```typescript
<FormInput
  control={form.control}
  name="email"
  label="Email Address"
  placeholder="Enter your email"
  keyboardType="email-address"
  autoComplete="email"
/>
```

## 🔧 Customization

### **Styling**
The app uses **NativeWind** (Tailwind CSS for React Native):
- No custom StyleSheets needed
- Consistent spacing and colors
- Easy to customize with Tailwind classes

### **Branding**
Update branding in:
- `constants/Config.ts` - App configuration
- `constants/Colors.ts` - Theme colors
- `app.json` - App metadata

### **Authentication Options**
Configure in Clerk dashboard:
- Enable/disable OAuth providers
- Customize email templates
- Set up custom domains
- Configure session settings

## 📚 Available Scripts

```bash
# Development
npm start                 # Start Expo development server
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
npm run web              # Run in web browser

# Code Quality
npm run lint             # ESLint check
npm run type-check       # TypeScript check
npm test                 # Run tests (if configured)

# Build
npm run build            # Build for production
```

## 🔒 Security Best Practices

This starter follows security best practices:

- ✅ **No hardcoded secrets** - Environment variables only
- ✅ **Secure token storage** - Using expo-secure-store
- ✅ **Input validation** - Client + server-side validation
- ✅ **Error handling** - No sensitive data in error messages
- ✅ **OAuth security** - Proper redirect URI handling
- ✅ **Type safety** - Prevents runtime errors

## 🚢 Production Deployment

### **Environment Variables**
Update for production:
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your-production-key
```

### **OAuth Redirect URIs**
Configure production URLs in Clerk:
- iOS: `your-app-scheme://oauth-callback`
- Android: `your-app-scheme://oauth-callback`
- Web: `https://your-domain.com/oauth-callback`

### **App Store Requirements**
- Test all OAuth flows on device
- Verify email deliverability
- Test password reset flows
- Ensure accessibility compliance

## 🤝 Contributing

This is a starter template, but contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - feel free to use this starter for any project.

## 🆘 Support

- **Clerk Documentation**: https://clerk.com/docs
- **Expo Documentation**: https://docs.expo.dev
- **NativeWind Documentation**: https://www.nativewind.dev

---

**Built with ❤️ using modern React Native practices**

*This starter saves you weeks of development time by providing a complete, production-ready authentication system with proper TypeScript integration and modern UI/UX patterns.*
