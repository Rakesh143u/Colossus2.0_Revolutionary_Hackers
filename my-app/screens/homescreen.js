// screens/HomeScreen.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";

const HomeScreen = ({ navigation }) => {
  const handleChatIconPress = () => {
    // Navigate to the Chat List Screen
    navigation.navigate("ChatList");
  };

  const handleProfilePress = () => {
    navigation.navigate("Profile"); // (Assuming you have a Profile screen)
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#6A00FF", "#8E2DE2"]} style={styles.container}>
        {/* Top Navigation Bar */}
        <View style={styles.topNav}>
          <Text style={styles.topNavTitle}>SafeHer</Text>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            <Icon name="user" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.welcome}>Welcome to SafeHer</Text>
          <Text style={styles.subText}>Your Safety Dashboard</Text>
          {/* Additional dashboard widgets can go here */}
        </View>
        {/* Floating Chat Icon */}
        <TouchableOpacity style={styles.chatIcon} onPress={handleChatIconPress}>
          <Icon name="comments" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1 },
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
  profileButton: { padding: 5 },
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
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default HomeScreen;
