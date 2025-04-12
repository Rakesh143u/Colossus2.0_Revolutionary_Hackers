import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { BleManager } from "react-native-ble-plx";
import { decode as atob } from "base-64";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome";

const DEVICE_NAME = "ESP32 Button BLE";
const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "abcd1234-5678-90ab-cdef-1234567890ab";

const EmergencyScreen = ({ navigation }) => {
  const [manager] = useState(new BleManager());
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [pressCount, setPressCount] = useState(0);
  const [pressStatus, setPressStatus] = useState("");

  const pressCountRef = useRef(0);
  const timerRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const subscription = manager.onStateChange((state) => {
      console.log("Bluetooth state changed:", state);
      if (state === "PoweredOn") {
        startScanning();
        subscription.remove();
      }
    }, true);

    return () => {
      mountedRef.current = false;
      manager.destroy();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [manager]);

  const startScanning = () => {
    setIsScanning(true);
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) return;
      if (device?.name === DEVICE_NAME) {
        manager.stopDeviceScan();
        setIsScanning(false);
        connectToDevice(device);
      }
    });
  };

  const connectToDevice = async (device) => {
    try {
      const connected = await device.connect();
      setConnectedDevice(connected);
      await connected.discoverAllServicesAndCharacteristics();
      setupCharacteristicMonitoring(connected);
    } catch (error) {
      Alert.alert("Connection Error", "Retrying connection...");
      setTimeout(startScanning, 3000);
    }
  };

  const setupCharacteristicMonitoring = (device) => {
    device.monitorCharacteristicForService(
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          if (error.message.includes("disconnected")) {
            setConnectedDevice(null);
            setTimeout(startScanning, 3000);
          }
          return;
        }
        const receivedValue = characteristic.value
          ? atob(characteristic.value)
          : "";
        console.log("Characteristic update received:", receivedValue);

        if (receivedValue.includes("pressed")) {
          const pressMatch = receivedValue.match(/(twice|thrice|\d+ times?)/i);
          const pressText = pressMatch ? pressMatch[0] : "once";

          const countMap = {
            once: 1,
            twice: 2,
            thrice: 3,
          };

          const count =
            pressText in countMap
              ? countMap[pressText]
              : parseInt(pressText) || 1;

          pressCountRef.current = count;
          setPressCount(count);

          let status = `${count} Press${count > 1 ? "es" : ""} Detected`;
          if (count === 2) {
            status = "Double Press - Emergency Triggered!";
            // Uncomment triggerEmergency if you want to send an alert:
            // triggerEmergency();
            // Navigate to a Chat or AutoChat screen as needed:
            navigation.navigate("AutoChatScreen");
            
          } else if (count === 3) {
            status = "Triple Press Detected! Navigating to Safe Places...";
            navigation.navigate("LocationScreen1");
          }

          setPressStatus(status);

          setTimeout(() => {
            if (!mountedRef.current) return;
            pressCountRef.current = 0;
            setPressCount(0);
            setPressStatus("");
          }, 2000);
        }
      }
    );
  };

  const triggerEmergency = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("Location permission denied");

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      const response = await fetch(
        "http://192.168.163.124:3000/api/sendEmergency",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            latitude,
            longitude,
            message: `Emergency! Location: https://maps.google.com/?q=${latitude},${longitude}`,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to send alert");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency System</Text>
      <View style={styles.statusContainer}>
        {connectedDevice ? (
          <Text style={styles.connectedText}>
            Connected: {connectedDevice.name}
          </Text>
        ) : (
          <Text style={styles.scanningText}>
            {isScanning ? "Scanning..." : "Connecting..."}
          </Text>
        )}
        <View style={styles.pressContainer}>
          <Text style={styles.pressCount}>Button Presses: {pressCount}</Text>
          {pressStatus && <Text style={styles.pressStatus}>{pressStatus}</Text>}
        </View>
      </View>

      {/* Home Icon Button (Bottom Middle) */}
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Icon name="home" size={30} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#2c3e50",
  },
  statusContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  connectedText: {
    fontSize: 18,
    color: "#27ae60",
    marginBottom: 20,
  },
  scanningText: {
    fontSize: 16,
    color: "#e67e22",
  },
  pressContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  pressCount: {
    fontSize: 18,
    color: "#2c3e50",
    fontWeight: "600",
  },
  pressStatus: {
    fontSize: 16,
    color: "#e74c3c",
    marginTop: 10,
    fontWeight: "bold",
  },
  homeButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#6A00FF",
    padding: 15,
    borderRadius: 50,
    elevation: 5, // for Android shadow
    shadowColor: "#000", // for iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});

export default EmergencyScreen;
