import React, { useState } from 'react';
import { Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

type ButtonState = 'default' | 'disabled' | 'loading';

interface CustomButtonProps {
  title?: string;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  state?: ButtonState;
  paddingHorizontal?: number;
  paddingVertical?: number;
}

export default function CustomButton({
  title = '確定身份',
  onPress,
  style,
  textStyle,
  state = 'default',
  paddingHorizontal = 20,
  paddingVertical = 16,
}: CustomButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const getBgClass = () => {
    if (state === 'disabled') return 'bg-accent/60';
    if (isPressed) return 'bg-accent-hover';
    return 'bg-accent';
  };

  const getDisplayText = () => state === 'loading' ? '確認中⋯⋯' : title;

  return (
    <TouchableOpacity
      className={`w-[138px] h-[70px] rounded-full justify-center items-center ${getBgClass()}`}
      style={[
        isPressed ? {
          shadowColor: '#f7eeeeff',
          shadowOffset: { width: 2, height: 4 },
          shadowOpacity: 0.7,
          shadowRadius: 4,
          elevation: 3,
        } : null,
        { paddingHorizontal, paddingVertical },
        style,
      ]}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={1}
      disabled={state === 'disabled' || state === 'loading'}
    >
      <Text
        className="text-black text-center text-[17px] font-bold leading-5"
        style={textStyle}
      >
        {getDisplayText()}
      </Text>
    </TouchableOpacity>
  );
}
