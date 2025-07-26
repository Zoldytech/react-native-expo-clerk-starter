import { useUser } from '@clerk/clerk-expo';
import { Text, View } from 'react-native';
import SignOutButton from '../../components/SignOutButton';

export default function HomeScreen() {
  const { user } = useUser();

  return (
    <View className="flex-1 justify-center items-center bg-gray-50 px-6">
      <View className="bg-white rounded-lg shadow-md p-6 w-full max-w-sm">
        <Text className="text-2xl font-bold text-center mb-4 text-gray-800">
          Welcome to LinkupSoc! 🎉
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
        
        <View className="items-center">
          <SignOutButton />
        </View>
      </View>
    </View>
  );
}
