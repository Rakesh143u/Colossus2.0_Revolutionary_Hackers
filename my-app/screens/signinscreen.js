// SignUpScreen.js

import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://172.16.7.155:3000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: createEmail,
          password: createPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", data.message);
        // After successful signup, navigate to Login so the user can log in.
        navigation.navigate("Login");
      } else {
        Alert.alert("Error", data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Error", "Could not connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#6A00FF", "#8E2DE2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <View style={styles.header}>
            <Image
              source={require("../assets/shield.png")}
              style={styles.logo}
            />
            <Text style={styles.title}>Sign Up</Text>
            <Text style={styles.subtitle}>Join and get started!</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Icon name="user" size={20} color="#6A00FF" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon
                name="envelope"
                size={20}
                color="#6A00FF"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Create Email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={createEmail}
                onChangeText={setCreateEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={24} color="#6A00FF" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Create Password"
                placeholderTextColor="#999"
                secureTextEntry
                value={createPassword}
                onChangeText={setCreatePassword}
              />
            </View>

            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signupButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardAvoid: { flex: 1, justifyContent: "center" },
  header: { alignItems: "center", paddingBottom: 30 },
  logo: { width: 80, height: 80, marginBottom: 15 },
  title: { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 5 },
  subtitle: { fontSize: 16, color: "#fff", opacity: 0.9 },
  formContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: "#333", fontSize: 16 },
  signupButton: {
    backgroundColor: "#6A00FF",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  signupButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  loginContainer: { flexDirection: "row", justifyContent: "center" },
  loginText: { color: "#666", fontSize: 14 },
  loginLink: { color: "#6A00FF", fontWeight: "bold", fontSize: 14 },
});

export default SignUpScreen;
