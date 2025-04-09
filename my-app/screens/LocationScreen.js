import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const safePlacesMock = [
  {
    id: "1",
    name: "City Police Station",
    latitude: 37.78825,
    longitude: -122.4324,
  },
  {
    id: "2",
    name: "Community Center",
    latitude: 37.78925,
    longitude: -122.4314,
  },
];

const LocationScreen = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6A00FF" />
        <Text style={styles.loadingText}>Fetching your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
      >
        {safePlacesMock.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            title={place.name}
            pinColor="green"
          />
        ))}
      </MapView>
      <View style={styles.bottomSheet}>
        <Text style={styles.title}>Nearby Safe Places</Text>
        <FlatList
          data={safePlacesMock}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text style={styles.place}>{item.name}</Text>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#6A00FF",
  },
  place: {
    paddingVertical: 6,
    fontSize: 16,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
});

export default LocationScreen;
