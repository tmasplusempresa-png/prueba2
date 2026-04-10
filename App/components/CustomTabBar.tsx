import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";

export default props => {
  const {
    state,
    descriptors,
    navigation,
    activeBackgroundColor = "#00204a",
    activeTintColor = "#00f4f5",
    inactiveBackgroundColor = "#ffffff",
    inactiveTintColor = "#8a9bae"
  } = props;
  
  const { routes } = state;
  return (
    <SafeAreaView>
      <View
        style={{
          flexDirection: "row",
          height: 68,
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          paddingHorizontal: 8,
          borderTopWidth: 1,
          borderTopColor: "rgba(0, 32, 74, 0.08)",
        }}
      >
        {routes.map((route, index) => {
          const { options } = descriptors[route.key];

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const tintColor = isFocused ? activeTintColor : inactiveTintColor;
          const backgroundColor = isFocused
            ? activeBackgroundColor
            : inactiveBackgroundColor;

          const onPress = () => {
            navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={index}
              style={{
                backgroundColor: backgroundColor,
                flexDirection: "row",
                margin: 4,
                height: 46,
                padding: 8,
                paddingRight: 16,
                paddingLeft: 16,
                borderRadius: 23,
                justifyContent: "center",
                alignItems: "center",
                elevation: isFocused ? 4 : 0,
                shadowColor: "#00204a",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isFocused ? 0.15 : 0,
                shadowRadius: 4,
              }}
              onPress={onPress}
            >
              {options.tabBarIcon !== undefined &&
                options.tabBarIcon({ color: tintColor, size: 24 })}
              {isFocused && (
                <Text
                  style={{
                    marginLeft: 8,
                    color: tintColor,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  {label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};


