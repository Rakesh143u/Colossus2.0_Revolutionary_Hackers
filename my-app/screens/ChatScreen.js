// screens/ChatScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChatScreen = ({ route, navigation }) => {
  const { contact } = route.params;
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const scrollViewRef = useRef(null);

  // Load persisted messages when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const storedMessages = await AsyncStorage.getItem("messages");
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };
    loadMessages();
  }, []);

  // Persist messages to AsyncStorage
  const persistMessages = async (updatedMessages) => {
    try {
      await AsyncStorage.setItem("messages", JSON.stringify(updatedMessages));
    } catch (error) {
      console.error("Failed to save messages:", error);
    }
  };

  // Send a text message
  const handleSendMessage = async () => {
    if (!chatText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      type: "text",
      content: chatText,
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    persistMessages(updatedMessages);

    // Optionally, send the message to your backend API:
    // await sendMessageToBackend({ contact_id: contact.contact_id, type: newMessage.type, content: newMessage.content });

    setChatText("");
  };

  // Request location permission
  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Unable to access your location.");
      return false;
    }
    return true;
  };

  // Share live location
  const handleShareLiveLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    try {
      setLocationLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      const liveLocationURL = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

      const newMessage = {
        id: Date.now().toString(),
        type: "location",
        content: liveLocationURL,
        timestamp: new Date().toLocaleTimeString(),
      };

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      persistMessages(updatedMessages);

      // Optionally, send to backend API
      // await sendMessageToBackend({ contact_id: contact.contact_id, type: newMessage.type, content: newMessage.content });
    } catch (error) {
      Alert.alert("Error", "Unable to fetch your current location.");
      console.error(error);
    } finally {
      setLocationLoading(false);
    }
  };

  // Send an alert message
  const handleSendAlert = async () => {
    const alertMessage = {
      id: Date.now().toString(),
      type: "alert",
      content: "ALERT: I am in danger. Please help me!",
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedMessages = [...messages, alertMessage];
    setMessages(updatedMessages);
    persistMessages(updatedMessages);

    // Optionally, send alert message to backend API
    // await sendMessageToBackend({ contact_id: contact.contact_id, type: alertMessage.type, content: alertMessage.content });
  };

  // Optional: Function to send a message to your backend (requires proper API endpoint implementation)
  // const sendMessageToBackend = async (payload) => {
  //   try {
  //     const token = await AsyncStorage.getItem("token");
  //     if (!token) return;
  //     await fetch("http://your-backend-url/api/messages", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify(payload),
  //     });
  //   } catch (error) {
  //     console.error("Failed to send message to backend:", error);
  //   }
  // };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{contact.name}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.messagesContainer}
          ref={scrollViewRef}
          onContentSizeChange={() =>
            scrollViewRef.current.scrollToEnd({ animated: true })
          }
        >
          {messages.map((msg) => (
            <View key={msg.id} style={styles.messageBubble}>
              <Text style={styles.messageType}>
                {msg.type === "alert"
                  ? "Alert"
                  : msg.type === "location"
                  ? "Location"
                  : "Message"}
              </Text>
              {msg.type === "location" ? (
                <Text
                  style={[styles.messageText, { color: "#007BFF" }]}
                  onPress={() =>
                    Linking.openURL(msg.content).catch((err) =>
                      console.error(err)
                    )
                  }
                >
                  {msg.content}
                </Text>
              ) : (
                <Text style={styles.messageText}>{msg.content}</Text>
              )}
              <Text style={styles.timestamp}>{msg.timestamp}</Text>
            </View>
          ))}
          {locationLoading && (
            <ActivityIndicator size="large" color="#6A00FF" />
          )}
        </ScrollView>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type your message..."
            placeholderTextColor="#666"
            value={chatText}
            onChangeText={setChatText}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareLiveLocation}
          >
            <Text style={styles.actionButtonText}>Share Location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSendAlert}
          >
            <Text style={styles.actionButtonText}>Send Alert</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6A00FF",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 15,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  messagesContainer: {
    flex: 1,
  },
  messageBubble: {
    backgroundColor: "#EAEAEA",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  messageType: {
    fontSize: 12,
    color: "#555",
    marginBottom: 3,
  },
  messageText: { fontSize: 16, color: "#333" },
  timestamp: {
    fontSize: 10,
    color: "#999",
    textAlign: "right",
    marginTop: 5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingVertical: 8,
  },
  chatInput: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
    marginRight: 10,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: "#6A00FF",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  actionButton: {
    backgroundColor: "#FF4081",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default ChatScreen;
