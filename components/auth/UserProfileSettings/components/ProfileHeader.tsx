import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Alert, Image, Modal, ActivityIndicator } from 'react-native'

import { FontAwesome } from '@expo/vector-icons'
import { useUser } from '@clerk/clerk-expo'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import * as ImagePicker from 'expo-image-picker'

import FormInput from '@/components/FormInput'

// Profile update validation schema
const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
})

type ProfileUpdateFields = z.infer<typeof profileUpdateSchema>

interface ProfileHeaderProps {
  user: {
    id: string
    emailAddresses: Array<{
      id: string
      emailAddress: string
      verification?: { status: string }
    }>
    primaryEmailAddressId?: string | null
    firstName?: string
    lastName?: string
    fullName?: string
    imageUrl?: string
  }
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const { user: clerkUser } = useUser()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdateFields>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    },
  })

  const handleUpdateProfile = () => {
    // Reset form with current user data
    reset({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    })
    setShowEditModal(true)
  }

  const handleProfileSubmit = async (data: ProfileUpdateFields) => {
    if (!clerkUser) return

    setIsUpdating(true)
    try {
      await clerkUser.update({
        firstName: data.firstName,
        lastName: data.lastName,
      })
      
      Alert.alert(
        'Success',
        'Your profile has been updated successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowEditModal(false)
            }
          }
        ]
      )
    } catch (error: any) {
      console.error('Profile update error:', error)
      Alert.alert(
        'Error',
        error.errors?.[0]?.longMessage || 'Failed to update profile. Please try again.'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAvatarPress = () => {
    Alert.alert(
      'Change Avatar',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => openImagePicker('camera') },
        { text: 'Choose from Library', onPress: () => openImagePicker('library') },
      ]
    )
  }

  const openImagePicker = async (source: 'camera' | 'library') => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos.')
        return
      }

      if (source === 'camera') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()
        if (cameraStatus !== 'granted') {
          Alert.alert('Permission Required', 'Please grant permission to access your camera.')
          return
        }
      }

      const result = source === 'camera' 
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: "images",
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Image picker error:', error)
      Alert.alert('Error', 'Failed to select image. Please try again.')
    }
  }

  const uploadAvatar = async (imageUri: string) => {
    if (!clerkUser) return

    setIsUploadingAvatar(true)
    try {
      // For React Native with Clerk, we need to pass the image as a proper file object
      // First, let's read the file and create a proper file-like object
      const fileInfo = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      }
      
      // Use the file object directly with Clerk
      await clerkUser.setProfileImage({ file: fileInfo as any })
      
      Alert.alert('Success', 'Avatar updated successfully!')
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      Alert.alert(
        'Error',
        error.errors?.[0]?.longMessage || 'Failed to update avatar. Please try again.'
      )
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const getDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user.firstName) {
      return user.firstName
    }
    if (user.fullName) {
      return user.fullName
    }
    return user.emailAddresses[0]?.emailAddress || 'User'
  }

  return (
    <>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {/* Avatar */}
          <TouchableOpacity 
            onPress={handleAvatarPress}
            disabled={isUploadingAvatar}
            className="relative"
          >
            <Image 
              source={{ uri: user.imageUrl }}
              className="w-16 h-16 rounded-full"
            />
            
            {/* Camera icon overlay */}
            <View className={`absolute -bottom-1 -right-1 bg-white rounded-full p-2 border border-gray-200 ${
              isUploadingAvatar ? 'opacity-50' : ''
            }`}>
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#374151" />
              ) : (
                <FontAwesome name="camera" size={12} color="#374151" />
              )}
            </View>
            
            {isUploadingAvatar && (
              <View className="absolute inset-0 bg-black bg-opacity-30 rounded-full items-center justify-center">
                <ActivityIndicator size="large" color="white" />
              </View>
            )}
          </TouchableOpacity>

          {/* Name */}
          <View className="ml-4 flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {getDisplayName()}
            </Text>
            <Text className="text-sm text-gray-600">
              {user.emailAddresses[0]?.emailAddress}
            </Text>
          </View>
        </View>

        {/* Update button */}
        <TouchableOpacity
          onPress={handleUpdateProfile}
          disabled={isUpdating || isUploadingAvatar}
          className="bg-black rounded-lg px-4 py-2"
        >
          <Text className="text-white font-medium">
            {isUpdating ? 'Updating...' : 'Update profile'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text className="text-blue-500 font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Edit Profile</Text>
            <TouchableOpacity 
              onPress={handleSubmit(handleProfileSubmit)}
              disabled={isUpdating}
            >
              <Text className={`font-medium ${
                isUpdating ? 'text-gray-400' : 'text-blue-500'
              }`}>
                {isUpdating ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="p-6">
            <View className="mb-4">
              <FormInput
                control={control}
                name="firstName"
                label="First Name"
                placeholder="Enter your first name"
                autoCapitalize="words"
                autoComplete="given-name"
              />
            </View>

            <View className="mb-4">
              <FormInput
                control={control}
                name="lastName"
                label="Last Name"
                placeholder="Enter your last name"
                autoCapitalize="words"
                autoComplete="family-name"
              />
            </View>

            <Text className="text-gray-500 text-sm mt-4">
              Your profile information will be updated across all your connected accounts.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  )
} 