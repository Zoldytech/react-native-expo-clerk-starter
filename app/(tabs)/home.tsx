import React, { useState } from 'react'
import { Modal, Text, TouchableOpacity, View } from 'react-native'

import { useUser } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'

import SignOutButton from '../../components/auth/SignOutButton'
import UserProfileSettings from '../../components/auth/UserProfileSettings'

export default function HomeScreen() {
  const { user } = useUser()
  const [showProfileSettings, setShowProfileSettings] = useState(false)

  return (
    <View className="flex-1 justify-center items-center bg-gray-50 px-6">
      <View className="bg-white rounded-lg shadow-md p-6 w-full max-w-sm">
        <Text className="text-2xl font-bold text-center mb-4 text-gray-800">
          Welcome to react-native-expo-clerk-starter! 🎉
        </Text>
        
        {user && (
          <View className="mb-6">
            <Text className="text-gray-600 text-center mb-2">
              Hello, {user.emailAddresses[0]?.emailAddress}!
            </Text>
            <Text className="text-gray-500 text-center text-sm">
              You&apos;re successfully signed in
            </Text>
          </View>
        )}
        
        <View className="items-center space-y-3">
          <TouchableOpacity
            onPress={() => setShowProfileSettings(true)}
            className="bg-black rounded-lg py-3 px-6 flex-row items-center"
          >
            <FontAwesome name="user" size={16} color="white" />
            <Text className="text-white font-semibold ml-2">Profile Settings</Text>
          </TouchableOpacity>
          
          <SignOutButton />
        </View>
      </View>

      {/* Profile Settings Modal */}
      <Modal
        visible={showProfileSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowProfileSettings(false)}>
              <FontAwesome name="times" size={20} color="#374151" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Profile Settings</Text>
            <View className="w-5" />
          </View>
          <UserProfileSettings />
        </View>
      </Modal>
    </View>
  )
}
