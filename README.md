# LinkupSoc Mobile App

A modern social mobile app built with **Expo Router** and **Clerk Authentication**.

## 🚀 Features

- **Complete Authentication System** with Clerk
  - Email/password signup with first/last name collection
  - Email verification flow
  - Google & Apple OAuth integration
  - Form validation with real-time feedback

- **Modern UI/UX**
  - Built with **NativeWind** (Tailwind CSS for React Native)
  - Clean, minimalist design
  - Responsive layouts
  - Interactive button states

- **Type-Safe Forms**
  - **React Hook Form** integration
  - **Zod** schema validation
  - Proper error handling and field mapping

## 🛠 Tech Stack

- **Expo Router** - File-based routing
- **Clerk** - Authentication & user management
- **NativeWind** - Tailwind CSS for React Native
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **TypeScript** - Type safety

## 📦 Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env` file with your Clerk publishable key:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

## 📱 Authentication Flow

1. **Welcome Screen** - Choose sign in or sign up
2. **Sign Up** - Collect first name, last name, email, and password
3. **Email Verification** - Enter 6-digit code sent to email
4. **Sign In** - Email and password with social auth options
5. **Protected Routes** - Access to app after authentication

## 🎨 UI Components

- **FormInput** - Reusable form input with validation
- **SignInWith** - Social authentication buttons
- **NativeWind Styling** - No custom StyleSheets, pure Tailwind classes

## 🔧 Development

- **Linting**: `npm run lint`
- **iOS**: `npm run ios`
- **Android**: `npm run android`

## 📄 Project Structure

```
mobile-app/
├── app/
│   ├── (auth)/           # Authentication screens
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── verify.tsx
│   ├── (tabs)/           # Main app tabs
│   └── _layout.tsx       # Root layout with Clerk provider
├── components/
│   ├── FormInput.tsx     # Form input component
│   └── SignInWith.tsx    # Social auth component
└── assets/
    └── images/
        └── social-providers/  # Google & Apple icons
```

Built with ❤️ using modern React Native practices.
