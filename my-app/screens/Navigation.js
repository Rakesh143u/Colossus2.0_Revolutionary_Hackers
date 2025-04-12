// Navigation.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// Import your screens here
import ChatListScreen from "./screens/ChatListScreen";
import SafePlacesScreen from "./screens/SafePlacesScreen";
import EmergencyScreen from "./screens/EmergencyScreen";

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="EmergencyScreen">
        <Stack.Screen
          name="EmergencyScreen"
          component={EmergencyScreen}
          options={{ title: "Emergency" }}
        />
        <Stack.Screen
          name="ChatListScreen"
          component={ChatListScreen}
          options={{ title: "Emergency Contacts" }}
        />
        <Stack.Screen
          name="SafePlacesScreen"
          component={LocationScreen}
          options={{ title: "Find Safe Places" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
