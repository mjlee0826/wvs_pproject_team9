import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingProps {
  text?: string;
  opacity?: boolean;
}

const Loading = ({ text, opacity = true }: LoadingProps) => {
  return (
    <View
      className={`absolute inset-0 justify-center items-center z-[9999] ${opacity ? 'bg-white/70' : 'bg-transparent'}`}
    >
      <ActivityIndicator size="large" color="#4FD1C5" />
      {text && (
        <Text className="mt-3 text-base text-gray-700 font-medium">{text}</Text>
      )}
    </View>
  );
};

export default Loading;
