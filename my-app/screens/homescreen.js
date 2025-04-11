// screens/HomeScreen.js
import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";

const AnimatedPressableIcon = ({ onPress, iconName, size, color, style }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [style, { opacity: pressed ? 0.9 : 1 }]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Icon name={iconName} size={size} color={color} />
      </Animated.View>
    </Pressable>
  );
};

const HomeScreen = ({ navigation }) => {
  const handleChatIconPress = () => {
    // Navigate to the Chat List Screen
    navigation.navigate("ChatList");
  };

  const handleProfilePress = () => {
    // Navigate to the Profile Screen
    navigation.navigate("Profile");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#6A00FF", "#8E2DE2"]} style={styles.container}>
        {/* Top Navigation Bar */}
        <View style={styles.topNav}>
          <Text style={styles.topNavTitle}>SurakshaBandhu</Text>
          <AnimatedPressableIcon
            onPress={handleProfilePress}
            iconName="user"
            size={24}
            color="#fff"
            style={styles.profileButton}
          />
        </View>

        {/* Instructional Container positioned below the top nav (profile area) */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <Text style={styles.instructionText}>
            • Press the device two times to trigger emergency alerts.
          </Text>
          <Text style={styles.instructionText}>
            • Press the the device thrice to an medical emergency.
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.welcome}>Welcome to SurakshaBandhu</Text>
          <Text style={styles.subText}>Your Safety Dashboard</Text>
          {/* Additional dashboard widgets can go here */}
        </View>

        {/* Floating Chat Icon */}
        <AnimatedPressableIcon
          onPress={handleChatIconPress}
          iconName="comments"
          size={24}
          color="#fff"
          style={styles.chatIcon}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  topNavTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  profileButton: {
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
    backgroundColor: "transparent",
    borderRadius: 20,
  },
  instructionsContainer: {
    position: "absolute",
    top: 80, // Position just below the top navigation area
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 10,
    borderRadius: 10,
    width: 200,
  },
  instructionsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  instructionText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 3,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  welcome: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  subText: {
    fontSize: 16,
    color: "#eee",
    marginTop: 8,
  },
  chatIcon: {
    position: "absolute",
    bottom: 70,
    right: 20,
    backgroundColor: "#FF4081",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
});

export default HomeScreen;
