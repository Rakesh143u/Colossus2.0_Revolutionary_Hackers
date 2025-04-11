// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/login";
import ContactsScreen from "./screens/contactsscreen";
import SignInScreen from "./screens/signinscreen";
import Tabs from "./Tabs";
import ProfileScreen from "./screens/profilescreen";
import ChatListScreen from "./screens/ChatListScreen";
import ChatScreen from "./screens/ChatScreen";
import EmergencyAlert from "./screens/EmergencyAlert"; // Updated import

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SignUp"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={Tabs} />
        <Stack.Screen name="Contacts" component={ContactsScreen} />
        <Stack.Screen name="SignUp" component={SignInScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        {/* Registered the EmergencyAlert screen */}
        <Stack.Screen name="EmergencyAlert" component={EmergencyAlert} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
