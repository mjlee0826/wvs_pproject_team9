import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable } from 'react-native';

interface Props {
  onPress?: () => void;
  isActive?: boolean;
}


export default function StudentIconButton({ onPress, isActive = false }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      speed: 60,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.0,
      speed: 25,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (isActive) {
      Animated.spring(scaleAnim, {
        toValue: 1.07,
        speed: 18,
        bounciness: 12,
        useNativeDriver: true,
      }).start();

      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }).start();

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.25,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 1.0,
        speed: 18,
        bounciness: 6,
        useNativeDriver: true,
      }).start();

      Animated.timing(bgAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();

      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive]);

  const animatedBgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(29,78,216,0)', 'rgba(29,78,216,0.65)'],
  });

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      {/* 外層脈動光暈（iOS 陰影） */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 160,
          height: 160,
          borderRadius: 80,
          top: -15,
          left: -25,
          zIndex: -1,
          backgroundColor: 'transparent',
          shadowColor: '#FFFFFF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 45,
          elevation: 30,
          opacity: pulseAnim,
        }}
      />

      {/* 深藍正圓背景（跨平台可見，選取時淡入） */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 130,
          height: 130,
          borderRadius: 65,
          top: -2.5,
          left: -10,
          zIndex: -1,
          backgroundColor: animatedBgColor,
        }}
      />

      {/* 熊圖示（整體縮放） */}
      <Animated.View
        style={{
          width: 110,
          height: 125,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Image
          source={require('../../assets/Bear/student.png')}
          className="w-[110px] h-[125px]"
          resizeMode="contain"
        />
      </Animated.View>
    </Pressable>
  );
}
