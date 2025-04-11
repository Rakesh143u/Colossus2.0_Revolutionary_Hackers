import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";

const SettingsScreen = () => {
  const [isDarkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.settingItem}>
        <Icon name="moon-o" size={24} color="#6A00FF" />
        <Text style={styles.settingText}>Dark Mode</Text>
        <Switch
          value={isDarkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: "#ccc", true: "#6A00FF" }}
        />
      </View>

      <View style={styles.settingItem}>
        <Icon name="bell" size={24} color="#6A00FF" />
        <Text style={styles.settingText}>Push Notifications</Text>
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ false: "#ccc", true: "#6A00FF" }}
        />
      </View>

      <View style={styles.accountSection}>
        <Text style={styles.accountLabel}>Account</Text>
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate("Profile")}
        >
          <Icon name="user" size={22} color="#6A00FF" />
          <Text style={styles.optionText}>Profile Info</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Icon name="lock" size={22} color="#6A00FF" />
          <Text style={styles.optionText}>Change Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    // Advanced card style with rounded corners and shadow
    borderRadius: 20,
    margin: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#6A00FF",
    marginBottom: 30,
    textAlign: "center",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "rgba(106, 0, 255, 0.1)",
  },
  settingText: {
    flex: 1,
    fontSize: 18,
    marginLeft: 10,
    color: "#333",
  },
  accountSection: {
    marginTop: 40,
  },
  accountLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "rgba(106, 0, 255, 0.1)",
    marginBottom: 10,
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#555",
  },
});

export default SettingsScreen;
