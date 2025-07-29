import React, { useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

import { useUser } from '@clerk/clerk-expo'

import ProfileSection from './ProfileSection'
import SecuritySection from './SecuritySection'

type TabType = 'profile' | 'security'

const tabs: { key: TabType; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'security', label: 'Security' },
]

export default function UserProfileSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading...</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">No user found</Text>
      </View>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection user={user} />
      case 'security':
        return <SecuritySection user={user} />
      default:
        return <ProfileSection user={user} />
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 pt-12 pb-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Account</Text>
        <Text className="text-gray-600">Manage your account info.</Text>
      </View>

      {/* Tab Navigation */}
      <View className="bg-white border-b border-gray-200">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="px-6"
        >
          <View className="flex-row py-4">
            {tabs.map((tab, index) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`pb-2 ${activeTab === tab.key ? 'border-b-2 border-black' : ''} ${index > 0 ? 'ml-8' : ''}`}
              >
                <Text
                  className={`font-medium ${
                    activeTab === tab.key ? 'text-black' : 'text-gray-600'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView className="flex-1">
        {renderContent()}
      </ScrollView>
    </View>
  )
} 