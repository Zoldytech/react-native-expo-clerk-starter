import React from 'react'
import {
  TextInput,
  TextInputProps,
  Text,
  View,
} from 'react-native'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

type FormInputProps<T extends FieldValues> = {
  control: Control<T>
  name: Path<T>
  label?: string
} & TextInputProps

export default function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  className,
  ...props
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { value, onChange, onBlur },
        fieldState: { error },
      }: any) => (
        <View className="mb-4">
          {label && (
            <Text className="text-gray-700 text-sm font-medium mb-2">
              {label}
            </Text>
          )}
          <TextInput
            {...props}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            className={`border rounded-lg px-4 py-3 bg-white ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${className || ''}`}
            placeholderTextColor="#9CA3AF"
          />
          {error && (
            <Text className="text-red-500 text-xs mt-1">
              {error.message}
            </Text>
          )}
        </View>
      )}
    />
  )
} 