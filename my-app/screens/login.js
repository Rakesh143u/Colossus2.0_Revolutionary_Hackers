import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://172.16.7.155:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", data.message);
        await AsyncStorage.multiSet([
          ["token", data.token],
          ["userId", data.user.id.toString()],
          ["tokenExpiry", (Date.now() + 3600000).toString()],
        ]);
        navigation.navigate("Home");
      } else {
        Alert.alert("Error", data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
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
          <ScrollView
            contentContainerStyle={styles.scrollView}
            keyboardShouldPersistTaps="handled"
          >
            <Animatable.View animation="fadeInDown" duration={1000} delay={300}>
              <View style={styles.header}>
                <Animatable.Image
                  animation="pulse"
                  iterationCount="infinite"
                  duration={2000}
                  source={require("../assets/shield.png")}
                  style={styles.logo}
                />
                <Text style={styles.title}>Suraksha Bandhu</Text>
                <Text style={styles.subtitle}>Your Safety, Our Priority</Text>
              </View>
            </Animatable.View>

            <Animatable.View
              animation="fadeInUp"
              duration={1000}
              delay={300}
              style={styles.formContainer}
            >
              <Animatable.View animation="slideInLeft" duration={800}>
                <View style={styles.inputContainer}>
                  <Icon
                    name="envelope"
                    size={20}
                    color="#6A00FF"
                    style={styles.icon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </Animatable.View>

              <Animatable.View
                animation="slideInRight"
                duration={800}
                delay={100}
              >
                <View style={styles.inputContainer}>
                  <Icon
                    name="lock"
                    size={24}
                    color="#6A00FF"
                    style={styles.icon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Icon
                      name={showPassword ? "eye-slash" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </Animatable.View>

              <Animatable.View animation="fadeIn" duration={1000} delay={600}>
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["#7F00FF", "#8E2DE2"]}
                    style={styles.gradientButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Animatable.Text
                        animation="pulse"
                        iterationCount="infinite"
                        style={styles.loginButtonText}
                      >
                        LOGIN
                      </Animatable.Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("SignUp")}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.signupLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </Animatable.View>
            </Animatable.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scrollView: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    paddingBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
    tintColor: "#fff",
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 5,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    marginVertical: 10,
    paddingHorizontal: 20,
    height: 55,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(106, 0, 255, 0.1)",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#333",
    fontSize: 16,
    height: "100%",
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginVertical: 10,
  },
  forgotPasswordText: {
    color: "#6A00FF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  loginButton: {
    borderRadius: 15,
    overflow: "hidden",
    marginVertical: 15,
    shadowColor: "#6A00FF",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  signupText: {
    color: "#666",
    fontSize: 14,
  },
  signupLink: {
    color: "#6A00FF",
    fontWeight: "bold",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
