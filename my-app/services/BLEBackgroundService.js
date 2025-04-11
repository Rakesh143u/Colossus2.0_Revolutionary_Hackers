// BLEBackgroundService.js
import { AppState, Platform } from "react-native";
import { BleManager } from "react-native-ble-plx";
import { decode as atob } from "base-64";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_NAME = "ESP32 Button BLE";
const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "abcd1234-5678-90ab-cdef-1234567890ab";

class BLEManagerService {
  constructor() {
    this.manager = new BleManager();
    this.connectedDevice = null;
    this.pressCount = 0;
    this.timer = null;
    this.scanTimer = null;
    this.appState = AppState.currentState;
    this.eventListeners = new Map();
    this.setupAppStateListener();
  }

  // Custom event emitter implementation
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(listener);
    return this;
  }

  off(event, listener) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(listener);
    }
    return this;
  }

  emit(event, ...args) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((listener) => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  setupAppStateListener() {
    AppState.addEventListener("change", (nextAppState) => {
      if (
        this.appState.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        this.startScanning();
      }
      this.appState = nextAppState;
    });
  }

  async initialize() {
    if (Platform.OS === "android") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return false;
    }

    return new Promise((resolve) => {
      const subscription = this.manager.onStateChange((state) => {
        if (state === "PoweredOn") {
          subscription.remove();
          this.startScanning();
          resolve(true);
        }
      }, true);
    });
  }

  startScanning() {
    this.manager.stopDeviceScan();
    this.manager.startDeviceScan(
      null,
      { allowDuplicates: false },
      (error, device) => {
        if (error || !device || device.name !== DEVICE_NAME) return;

        this.manager.stopDeviceScan();
        this.connectToDevice(device);
      }
    );

    this.scanTimer = setTimeout(() => this.startScanning(), 60000);
  }

  async connectToDevice(device) {
    try {
      const connectedDevice = await device.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();
      this.connectedDevice = connectedDevice;
      this.emit("deviceConnected");
      this.setupCharacteristicMonitoring(connectedDevice);
    } catch (error) {
      setTimeout(() => this.startScanning(), 3000);
    }
  }

  setupCharacteristicMonitoring(device) {
    device.monitorCharacteristicForService(
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          this.connectedDevice = null;
          this.emit("deviceDisconnected");
          return this.startScanning();
        }

        const value = characteristic.value ? atob(characteristic.value) : "";
        if (value.trim() !== "Button Pressed!") return;

        this.pressCount++;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          if (this.pressCount === 2) {
            this.emit("doublePress");
          } else if (this.pressCount === 3) {
            this.emit("triplePress");
            this.triggerEmergency();
          }
          this.pressCount = 0;
        }, 500);
      }
    );
  }

  async triggerEmergency() {
    try {
      const { coords } = await Location.getCurrentPositionAsync({});
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        "http://192.168.163.124:3000/api/sendEmergency",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            latitude: coords.latitude,
            longitude: coords.longitude,
            message: `Emergency! Location: https://maps.google.com/?q=${coords.latitude},${coords.longitude}`,
          }),
        }
      );

      if (response.ok) {
        this.emit("emergencySent");
      }
    } catch (error) {
      this.emit("emergencyError", error);
    }
  }

  cleanup() {
    this.manager.stopDeviceScan();
    this.manager.destroy();
    clearTimeout(this.timer);
    clearTimeout(this.scanTimer);
  }
}

export const bleService = new BLEManagerService();
