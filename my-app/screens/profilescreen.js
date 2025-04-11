// screens/profilescreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/FontAwesome";

const emergencyContacts = [
  { id: "1", name: "Mom", phone: "+123456789" },
  { id: "2", name: "Dad", phone: "+987654321" },
  { id: "3", name: "Friend", phone: "+1122334455" },
];

const ProfileScreen = ({ route, navigation }) => {
  // Retrieve user data passed via navigation parameters.
  const user = route.params?.user || {
    name: "Jane Doe",
    email: "jane@example.com",
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#6A00FF", "#8E2DE2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Animatable.Text
          animation="fadeInDown"
          duration={1000}
          style={styles.header}
        >
          Profile
        </Animatable.Text>

        <View style={styles.infoCard}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{user.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Emergency Contacts</Text>
        <FlatList
          data={emergencyContacts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contactList}
          renderItem={({ item, index }) => (
            <Animatable.View
              animation="fadeInUp"
              delay={index * 100}
              style={styles.contactCard}
            >
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phone}</Text>
            </Animatable.View>
          )}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradientContainer: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  header: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 30,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    width: 90,
  },
  value: {
    fontSize: 18,
    color: "#555",
    flexShrink: 1,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  contactList: {
    paddingBottom: 20,
  },
  contactCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  contactPhone: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
});

export default ProfileScreen;
