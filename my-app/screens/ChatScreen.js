// screens/ChatScreen.js
import React, { useState, useEffect, useRef } from "react";
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
import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChatScreen = ({ route, navigation }) => {
  const { contact } = route.params;
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const initializeSocket = async () => {
      const token = await AsyncStorage.getItem("token");
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);

      const newSocket = io("http://192.168.163.124:3000", {
        auth: { token },
      });

      newSocket.on("connect", () => {
        console.log("Connected to socket");
        const room = getRoomId(id, contact.contact_id);
        newSocket.emit("joinRoom", room);
      });

      newSocket.on("chatMessage", (message) => {
        setMessages((prev) => [
          ...prev,
          {
            ...message,
            id: message.id.toString(),
            timestamp: new Date(message.created_at).toLocaleTimeString(),
          },
        ]);
      });

      newSocket.on("error", (error) => {
        Alert.alert("Connection Error", error);
      });

      setSocket(newSocket);
      loadPreviousMessages(id, contact.contact_id);

      return () => {
        newSocket.disconnect();
      };
    };

    initializeSocket();
  }, [contact]);

  const getRoomId = (userId, contactId) => {
    return [userId, contactId]
      .map(Number)
      .sort((a, b) => a - b)
      .join("_");
  };

  const loadPreviousMessages = async (userId, contactId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        `http://192.168.163.124:3000/api/messages?contactId=${contactId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(
          data.map((msg) => ({
            ...msg,
            id: msg.id.toString(),
            timestamp: new Date(msg.created_at).toLocaleTimeString(),
          }))
        );
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const sendMessage = async (messageData) => {
    try {
      const room = getRoomId(userId, contact.contact_id);
      const message = {
        ...messageData,
        timestamp: new Date().toISOString(),
      };

      socket.emit("chatMessage", {
        room,
        message: {
          ...message,
          type: messageData.type || "text",
          content: messageData.content,
        },
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Unable to access your location.");
      return false;
    }
    return true;
  };

  const handleSendMessage = () => {
    if (!chatText.trim()) return;

    const newMessage = {
      type: "text",
      content: chatText,
    };

    sendMessage(newMessage);
    setChatText("");
  };

  const handleShareLiveLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    try {
      setLocationLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      const liveLocationURL = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

      const newMessage = {
        type: "location",
        content: liveLocationURL,
      };

      sendMessage(newMessage);
    } catch (error) {
      Alert.alert("Error", "Unable to fetch your current location.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSendAlert = () => {
    const alertMessage = {
      type: "alert",
      content: "ALERT: I am in danger. Please help me!",
    };

    sendMessage(alertMessage);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{contact.contact_name}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.messagesContainer}
          ref={scrollViewRef}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
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
    marginBottom: 10,
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
  messageText: {
    fontSize: 16,
    color: "#333",
  },
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
    color: "#333",
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
