// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/login";
import ContactsScreen from "./screens/contactsscreen";
import SignInScreen from "./screens/signinscreen";
import Tabs from "./Tabs";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SignUp"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        {/* Use Tabs as the main navigation container after login */}
        <Stack.Screen name="Home" component={Tabs} />
        <Stack.Screen name="Contacts" component={ContactsScreen} />
        <Stack.Screen name="SignUp" component={SignInScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
