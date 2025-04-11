// Tabs.js
import React, { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "./screens/homescreen";
import ContactsScreen from "./screens/contactsscreen";
import LocationScreen from "./screens/LocationScreen";
import SettingsScreen from "./screens/SettingsScreen";
import Icon from "react-native-vector-icons/FontAwesome";

// This dummy component instantly redirects to EmergencyAlert
const AlertRedirectScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // As soon as the tab is selected, navigate to EmergencyAlert
    navigation.navigate("EmergencyAlert");
  }, [navigation]);

  // Return nothing so it doesn't flash any UI
  return null;
};

const Tab = createBottomTabNavigator();

export default function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6A00FF",
        tabBarInactiveTintColor: "gray",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="phone" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Location"
        component={LocationScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="map-marker" size={size} color={color} />
          ),
        }}
      />
      {/* Use the AlertRedirectScreen to trigger emergency */}
      <Tab.Screen
        name="Alert"
        component={AlertRedirectScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="exclamation-triangle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
