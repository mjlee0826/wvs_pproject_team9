import React from 'react';
import { Image, ImageSourcePropType, TouchableOpacity } from 'react-native';

interface BlueButtonProps {
  onPress?: () => void;
  bottom?: number;
  iconSource?: ImageSourcePropType;
}

const BlueButton = ({ onPress, bottom = 32, iconSource }: BlueButtonProps) => {
  return (
    <TouchableOpacity
      className="absolute right-6 z-[999] w-14 h-14 rounded-full bg-transparent overflow-hidden justify-center items-center"
      style={{ bottom }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={iconSource || require('../../assets/icons/addpost.png')}
        className="w-full h-full"
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

export default BlueButton;
