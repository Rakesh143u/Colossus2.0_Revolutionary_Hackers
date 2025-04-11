import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Contacts from "expo-contacts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome";

const ContactsScreen = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [tokenItem, tokenExpiryItem] = await AsyncStorage.multiGet([
          "token",
          "tokenExpiry",
        ]);

        if (
          !tokenItem[1] ||
          Date.now() > parseInt(tokenExpiryItem[1] || 0, 10)
        ) {
          await AsyncStorage.multiRemove(["token", "userId", "tokenExpiry"]);
          navigation.replace("Login");
          return;
        }

        setLoading(false);
        fetchContacts();
        fetchEmergencyContacts();
      } catch (err) {
        console.error("Auth check error:", err);
        navigation.replace("Login");
      }
    };

    checkAuth();
  }, [navigation]);

  const fetchContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        setContacts(data.filter((c) => c.phoneNumbers?.length > 0));
      }
    } catch (err) {
      Alert.alert("Error", "Failed to fetch contacts");
      console.error("Contacts fetch error:", err);
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        "http://192.168.163.124:3000/api/emergency",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error: ${text}`);
      }

      const result = await response.json();
      setEmergencyContacts(result);
    } catch (error) {
      Alert.alert("Error", error.message || "Connection error");
      console.error("Emergency fetch error:", error);
    }
  };

  const toggleEmergencyContact = async (contact) => {
    try {
      setProcessingIds((prev) => new Set([...prev, contact.id]));

      const phoneNumber = contact.phoneNumbers[0]?.number;
      if (!phoneNumber) {
        throw new Error("Contact must have a valid phone number");
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      const response = await fetch(
        "http://192.168.163.124:3000/api/emergency",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            contact_id: contact.id.toString(),
            contact_name: contact.name,
            contact_number: phoneNumber,
          }),
        }
      );

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Invalid response: ${text}`);
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Operation failed");

      await fetchEmergencyContacts();
    } catch (error) {
      console.error("Toggle error:", error);

      if (error.message.includes("User not found")) {
        await AsyncStorage.multiRemove(["token", "userId", "tokenExpiry"]);
        Alert.alert("Session Expired", "Please login again");
        navigation.replace("Login");
        return;
      }

      Alert.alert("Error", error.message || "Failed to save contact");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(contact.id);
        return newSet;
      });
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#bbb" style={styles.searchIcon} />
        <TextInput
          placeholder="Search contacts..."
          placeholderTextColor="#bbb"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {emergencyContacts.length > 0 && (
        <View style={styles.emergencyListContainer}>
          <Text style={styles.emergencyListTitle}>
            Marked Emergency Contacts
          </Text>
          <FlatList
            data={emergencyContacts}
            keyExtractor={(item) => item.contact_id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.emergencyContactCard}>
                <Text style={styles.emergencyContactName}>
                  {item.contact_name}
                </Text>
              </View>
            )}
          />
        </View>
      )}

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isEmergency = emergencyContacts.some(
            (ec) => ec.contact_id === item.id
          );
          const isProcessing = processingIds.has(item.id);

          return (
            <View style={styles.contactItem}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                {item.phoneNumbers?.[0]?.number && (
                  <Text style={styles.contactPhone}>
                    {item.phoneNumbers[0].number}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.button,
                  isEmergency && styles.emergencyButton,
                  isProcessing && styles.processingButton,
                ]}
                onPress={() => toggleEmergencyContact(item)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon
                      name={isEmergency ? "check-circle" : "exclamation-circle"}
                      size={16}
                      color="#fff"
                      style={{ marginRight: 5 }}
                    />
                    <Text style={styles.buttonText}>
                      {isEmergency ? "Marked" : "Mark Emergency"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate("MainHome")}
      >
        <Icon name="home" size={24} color="#fff" />
        <Text style={styles.homeButtonText}>Return Home</Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: "#333",
  },
  emergencyListContainer: {
    marginHorizontal: 15,
    marginBottom: 10,
  },
  emergencyListTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A90E2",
    marginBottom: 5,
  },
  emergencyContactCard: {
    backgroundColor: "#FF6F61",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  emergencyContactName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 80,
  },
  contactItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
  },
  contactPhone: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#4A90E2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  emergencyButton: {
    backgroundColor: "#FF6F61",
  },
  processingButton: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  homeButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#4A90E2",
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  homeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
});

export default ContactsScreen;
