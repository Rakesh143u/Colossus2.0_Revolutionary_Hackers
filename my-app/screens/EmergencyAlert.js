// EmergencyScreen.js
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { BleManager } from "react-native-ble-plx";
import { decode as atob } from "base-64";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Update these constants to match your ESP32 advertisement and service/characteristic UUIDs.
const DEVICE_NAME = "ESP32 Button BLE";
const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "abcd1234-5678-90ab-cdef-1234567890ab";

const EmergencyScreen = () => {
  const [manager] = useState(new BleManager());
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // useRef variables for counting presses and handling debounce timer
  const pressCountRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // Monitor Bluetooth state.
    const subscription = manager.onStateChange((state) => {
      console.log("Bluetooth state changed:", state);
      if (state === "PoweredOn") {
        console.log("Bluetooth is powered on.");
        startScanning();
        subscription.remove();
      }
    }, true);

    // Clean up on component unmount.
    return () => {
      console.log("Cleaning up BLE Manager...");
      manager.destroy();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [manager]);

  const startScanning = () => {
    setIsScanning(true);
    console.log("Starting BLE scan for devices...");
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("Error during scan:", error);
        return;
      }
      if (device) {
        const deviceName = device.name ? device.name : "Unnamed";
        console.log(`Found device: ${deviceName}`);
      }
      if (device && device.name === DEVICE_NAME) {
        console.log(`Target device "${DEVICE_NAME}" found.`);
        manager.stopDeviceScan();
        setIsScanning(false);
        connectToDevice(device);
      }
    });
  };

  const connectToDevice = async (device) => {
    console.log("Attempting to connect to device:", device.name);
    try {
      const connected = await device.connect();
      console.log("Connected to device:", connected.name);
      setConnectedDevice(connected);

      // Discover services and characteristics.
      console.log("Discovering services and characteristics...");
      await connected.discoverAllServicesAndCharacteristics();
      console.log("Services and characteristics discovered.");
      setupCharacteristicMonitoring(connected);
    } catch (error) {
      console.error("Error connecting to device:", error);
      Alert.alert(
        "Connection Error",
        "Failed to connect to the ESP32. Retrying scan..."
      );
      setTimeout(() => startScanning(), 3000);
    }
  };

  const setupCharacteristicMonitoring = (device) => {
    console.log("Setting up characteristic monitoring...");
    device.monitorCharacteristicForService(
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          console.error("Error during characteristic monitoring:", error);
          // If the device disconnects, reset and rescan.
          if (error.message && error.message.includes("disconnected")) {
            console.log("Device disconnected. Restarting scan...");
            setConnectedDevice(null);
            setTimeout(() => startScanning(), 3000);
          }
          return;
        }
        const receivedValue = characteristic.value
          ? atob(characteristic.value)
          : "";
        console.log("Characteristic update received:", receivedValue);

        if (receivedValue.trim() === "Button Pressed!") {
          // Increment button press count.
          pressCountRef.current += 1;
          // Clear any existing debounce timer.
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
          // Set a debounce timer (500ms). After the timeout, evaluate the number of presses.
          timerRef.current = setTimeout(() => {
            if (pressCountRef.current === 2) {
              console.log("Detected button pressed twice");
            } else if (pressCountRef.current === 3) {
              console.log("Detected button pressed thrice");
            } else {
              console.log(
                `Detected button pressed ${pressCountRef.current} time(s)`
              );
            }
            // Reset the count and timer.
            pressCountRef.current = 0;
            timerRef.current = null;
          }, 500);
        }
      }
    );
  };

  // The triggerEmergency function is left intact in case you want to call it from elsewhere.
  const triggerEmergency = async () => {
    try {
      // Request location permission.
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location access is required to send your position."
        );
        return;
      }
      // Get the current location.
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      console.log(`Location obtained: ${latitude}, ${longitude}`);

      // Get the JWT token from AsyncStorage.
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          "Authentication Error",
          "User is not logged in. Cannot send emergency alert."
        );
        return;
      }

      // Compose the emergency message; you can customize this as needed.
      const emergencyMessage = `Emergency! Please help. Current location: https://maps.google.com/?q=${latitude},${longitude}`;

      // Send the POST request to your backend API.
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
            message: emergencyMessage,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        console.log("Emergency SMS sent successfully:", data.message);
        Alert.alert(
          "Emergency Alert",
          "Emergency SMS sent successfully to all contacts."
        );
      } else {
        console.error("Error sending emergency SMS:", data.error);
        Alert.alert("Error", data.error || "Failed to send emergency SMS.");
      }
    } catch (error) {
      console.error("Error in triggerEmergency:", error);
      Alert.alert(
        "Error",
        "An error occurred while sending the emergency alert."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Screen</Text>
      {connectedDevice ? (
        <Text style={styles.statusText}>
          Connected to: {connectedDevice.name}
        </Text>
      ) : (
        <Text style={styles.statusText}>
          {isScanning
            ? "Scanning for ESP32 device..."
            : "Not connected. Retrying scan..."}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
  statusText: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default EmergencyScreen;
