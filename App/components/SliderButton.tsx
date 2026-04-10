import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { colors } from "@/scripts/theme";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Entypo } from "@expo/vector-icons";

const SliderButton = ({ onSlideCompleted }) => {
  const END_POSITION = Dimensions.get("screen").width - 90;  // Calculating button width
  const onLeft = useSharedValue(true);
  const position = useSharedValue(0);

  const panGesture = Gesture.Pan()  // Defining gesture type to Pan
    .runOnJS(true)  // This is required if you want to trigger a function on swipe
    .onUpdate((e) => {
      if (onLeft.value) {
        position.value = e.translationX;
      } else {
        position.value = END_POSITION + e.translationX;
      }
    })
    .onEnd(() => {
      if (position.value > END_POSITION / 1.5) {  // This is the snap point, adjust 1.5 accordingly
        position.value = withTiming(END_POSITION, { duration: 100 });
        onLeft.value = false;
        if (onSlideCompleted) {
          onSlideCompleted();  // Call the function when slide is completed
        }
      } else {
        position.value = withTiming(0, { duration: 100 });
        onLeft.value = true;
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value }],
  }));

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderText}>Desliza para finalizar</Text>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.swipeBtn, animatedStyle]}>
          <Entypo name="chevron-thin-right" size={24} color={colors.DULL_RED} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default SliderButton;

const styles = StyleSheet.create({
  sliderContainer: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#E91E63",
    position: "relative",
    height: 50,
    overflow: "hidden",
    borderRadius: 50,
  },
  sliderText: {
    color: "#fff",
    fontSize: 18,
  },
  swipeBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    position: "absolute",
    left: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
});