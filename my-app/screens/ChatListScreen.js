// screens/ChatListScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChatListScreen = ({ navigation }) => {
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmergencyContacts = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch(
          "http://192.168.163.124:3000/api/emergency",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const result = await response.json();
          setEmergencyContacts(result);
        } else {
          const text = await response.text();
          console.error("Expected JSON but received:", text);
        }
      } catch (error) {
        console.error("Error fetching emergency contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencyContacts();
  }, []);

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
      <Text style={styles.contactName}>{item.contact_name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#fff" />
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
          <Text style={styles.title}>Chats</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>
        <FlatList
          data={emergencyContacts}
          keyExtractor={(item) => item.contact_id.toString()}
          renderItem={renderContactItem}
          contentContainerStyle={styles.contactsList}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: { padding: 5 },
  backButtonPlaceholder: { width: 34 },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
  },
  contactsList: { paddingBottom: 20 },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  contactName: { fontSize: 18, color: "#333" },
});

export default ChatListScreen;
