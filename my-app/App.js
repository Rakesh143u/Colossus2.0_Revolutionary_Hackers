// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import screens
import LoginScreen from "./screens/login";
import ContactsScreen from "./screens/contactsscreen";
import SignInScreen from "./screens/signinscreen";
import Tabs from "./Tabs";
import ProfileScreen from "./screens/profilescreen";
import ChatListScreen from "./screens/ChatListScreen";
import ChatScreen from "./screens/ChatScreen";
import ChatbotScreen from "./screens/ChatbotScreen";
import EmergencyAlert from "./screens/EmergencyAlert"; // Ensure this points to your emergency alert screen
import LocationScreen from "./screens/LocationScreen";
import AutoChatScreen from "./screens/AutoChatScreen";
import LocationScreen1 from "./screens/LocationScreen1";

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
        <Stack.Screen name="ChatbotScreen" component={ChatbotScreen} />
        <Stack.Screen name="EmergencyAlert" component={EmergencyAlert} />
        <Stack.Screen name="LocationScreen" component={LocationScreen} />
        <Stack.Screen name="AutoChatScreen" component={AutoChatScreen} />
        <Stack.Screen name="LocationScreen1" component={LocationScreen1}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
