import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

const SettingsScreen = () => {
  const [isDarkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

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
        <TouchableOpacity style={styles.option}>
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
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#6A00FF",
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  settingText: {
    flex: 1,
    fontSize: 18,
    marginLeft: 10,
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
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#555",
  },
});

export default SettingsScreen;
