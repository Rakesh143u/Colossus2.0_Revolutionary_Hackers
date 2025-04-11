// screens/ChatScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import io from "socket.io-client";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";

const SOCKET_SERVER_URL = "http://192.168.163.124:3000";

const ChatScreen = ({ route }) => {
  const { contact } = route.params; // emergency contact details
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [room, setRoom] = useState(null);
  const [userId, setUserId] = useState("");
  const socketRef = useRef();

  useEffect(() => {
    // Get current user id from AsyncStorage
    const loadUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
    };
    loadUserId();

    socketRef.current = io(SOCKET_SERVER_URL);

    (async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      socketRef.current.emit("authenticate", { userId: storedUserId });
      // Create a unique room name e.g. "chat_<userId>_<contactId>"
      const roomName = `chat_${storedUserId}_${contact.contact_id}`;
      setRoom(roomName);
      socketRef.current.emit("joinRoom", roomName);
    })();

    // Listen for incoming messages
    socketRef.current.on("chatMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Disconnect socket when leaving the screen
    return () => {
      socketRef.current.disconnect();
    };
  }, [contact]);

  // Function to send a message or distress message with location
  const sendMessage = async (isDistress = false) => {
    try {
      const senderId = await AsyncStorage.getItem("userId");
      let locationData = {};

      if (isDistress) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission denied", "Location permission is required.");
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }

      const messageData = {
        room,
        senderId,
        message: isDistress ? "DISTRESS" : text,
        ...locationData,
      };

      // Emit the message via socket
      socketRef.current.emit("chatMessage", messageData);
      // Optimistically update local state
      setMessages((prev) => [...prev, { ...messageData, sender: senderId }]);
      setText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Render each message with optional location information
  const renderMessage = ({ item }) => (
    <View style={styles.messageBubble}>
      <Text style={styles.messageText}>
        {item.sender === userId ? "Me" : contact.contact_name} : {item.message}
      </Text>
      {item.latitude && item.longitude && (
        <Text style={styles.locationText}>
          Location: {Number(item.latitude).toFixed(4)},{" "}
          {Number(item.longitude).toFixed(4)}
        </Text>
      )}
    </View>
  );

  return (
    <LinearGradient colors={["#6A00FF", "#8E2DE2"]} style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        style={styles.messagesContainer}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          placeholder="Type your message..."
          placeholderTextColor="#666"
          onChangeText={setText}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => sendMessage(false)}
        >
          <Icon name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.distressButton}
        onPress={() => sendMessage(true)}
      >
        <Text style={styles.distressText}>
          Send Distress Message with Location
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 40 },
  messagesContainer: { flex: 1, marginBottom: 10 },
  messageBubble: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  messageText: { fontSize: 16, color: "#333" },
  locationText: { fontSize: 12, color: "#555" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  sendButton: {
    backgroundColor: "#6A00FF",
    padding: 10,
    borderRadius: 25,
    marginLeft: 10,
  },
  distressButton: {
    backgroundColor: "#FF6F61",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  distressText: { color: "#fff", fontWeight: "bold" },
});

export default ChatScreen;
