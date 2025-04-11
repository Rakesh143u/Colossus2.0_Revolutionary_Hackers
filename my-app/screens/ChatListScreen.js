// screens/ChatListScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChatListScreen = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmergencyContacts = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.navigate("Login");
        return;
      }

      const response = await fetch(
        "http://192.168.163.124:3000/api/emergency",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch contacts");

      const data = await response.json();
      setContacts(data);
    } catch (err) {
      setError(err.message);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchEmergencyContacts);
    return unsubscribe;
  }, [navigation]);

  const renderContactItem = ({ item }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => navigation.navigate("Chat", { contact: item })}
    >
      <Icon
        name="user-circle"
        size={30}
        color="#6A00FF"
        style={{ marginRight: 15 }}
      />
      <View>
        <Text style={styles.contactName}>{item.contact_name}</Text>
        <Text style={styles.contactNumber}>{item.contact_number}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A00FF" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchEmergencyContacts}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#6A00FF", "#8E2DE2"]} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Emergency Contacts</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        <FlatList
          data={contacts}
          keyExtractor={(item) => item.contact_id.toString()}
          renderItem={renderContactItem}
          contentContainerStyle={styles.contactsList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No emergency contacts found</Text>
          }
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  backButtonPlaceholder: {
    width: 34,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
  },
  contactsList: {
    paddingBottom: 20,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  contactName: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
  },
  contactNumber: {
    fontSize: 14,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 10,
  },
  retryText: {
    color: "#6A00FF",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
  },
});

export default ChatListScreen;
