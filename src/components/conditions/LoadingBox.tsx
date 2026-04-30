import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface LoadingBoxProps {
  className?: string;
}

export function LoadingBox({ className }: LoadingBoxProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-280, 280],
  });

  return (
    <View
      className={`absolute inset-0 overflow-hidden rounded-xl ${className ?? ""}`}
      style={{ backgroundColor: "#202020" }}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "60%",
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.03)", "rgba(255,255,255,0.14)", "rgba(255,255,255,0.03)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>
    </View>
  );
}
