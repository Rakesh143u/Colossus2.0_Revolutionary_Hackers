import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  TouchableOpacity,
  Linking,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";

// Helper: Decode an encoded polyline string returned by Google Directions API.
const decodePolyline = (encoded) => {
  let points = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};

// Helper: Calculate straight-line distance (in km) between two points using the haversine formula.
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const LocationScreen1 = () => {
  const [location, setLocation] = useState(null); // User's current location.
  const [destination, setDestination] = useState(null); // Destination coordinate.
  const [routeCoordinates, setRouteCoordinates] = useState([]); // Driving route polyline.
  const [region, setRegion] = useState(null); // Map region.
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("safe places"); // Default search query.
  const [safePlaces, setSafePlaces] = useState([]); // Array of nearby safe places.

  const mapRef = useRef(null);
  const GOOGLE_API_KEY = "AIzaSyCc2Oa-tvEn_57DthaLy92bLWoGeGF49sE"; // Replace with your valid API key.

  // Obtain location on mount and trigger search with default query.
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access location was denied."
        );
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      const initialRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(initialRegion);
      setLoading(false);
      // Automatically trigger safe places search using the default query.
      handleSearch(currentLocation.coords);
    })();
  }, []);

  // Fetch a driving route from origin to destination using Google Directions API.
  const fetchRoute = async (origin, dest) => {
    try {
      setRouteCoordinates([]);
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destStr = `${dest.latitude},${dest.longitude}`;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${GOOGLE_API_KEY}&mode=driving`;
      const response = await fetch(url);
      const json = await response.json();

      if (json.status !== "OK" || !json.routes.length) {
        Alert.alert(
          "No route found",
          `Could not find a route. (Status: ${json.status})`
        );
        return;
      }

      const encodedPolyline = json.routes[0].overview_polyline.points;
      const points = decodePolyline(encodedPolyline);
      setRouteCoordinates(points);
    } catch (error) {
      Alert.alert(
        "Error fetching route",
        "Something went wrong while fetching the route."
      );
      console.error(error);
    }
  };

  // Fetch nearby safe places (police stations and hospitals) using Google Places API.
  const fetchSafePlaces = async (currentCoords) => {
    if (!currentCoords) return;
    try {
      const radius = 5000; // Search within a 5km radius.
      const baseUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${currentCoords.latitude},${currentCoords.longitude}&radius=${radius}&key=${GOOGLE_API_KEY}`;
      let combinedResults = [];
      const types = ["police", "hospital"];

      for (let type of types) {
        const url = `${baseUrl}&type=${type}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.results) {
          combinedResults = combinedResults.concat(data.results);
        }
      }
      setSafePlaces(combinedResults);
    } catch (error) {
      Alert.alert(
        "Error fetching safe places",
        "Something went wrong while fetching safe places."
      );
      console.error(error);
    }
  };

  // Search handler: if query includes "safe", fetch safe places.
  const handleSearch = async (currentCoords = location) => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery || !currentCoords) return;
    // If the query includes "safe" then fetch safe places.
    if (trimmedQuery.includes("safe")) {
      setDestination(null);
      setRouteCoordinates([]);
      await fetchSafePlaces(currentCoords);
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: currentCoords.latitude,
            longitude: currentCoords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          1000
        );
      }
    } else {
      // You can add geocoding search for non-safe queries if required.
      Alert.alert(
        "Info",
        'This search only supports "safe places" look-up by default.'
      );
    }
  };

  // Handle tapping on the map.
  const handleMapPress = (event) => {
    const tappedCoordinate = event.nativeEvent.coordinate;
    setDestination(tappedCoordinate);
    setRouteCoordinates([]);
    setRegion({
      ...tappedCoordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...tappedCoordinate,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
    if (location) {
      fetchRoute(location, tappedCoordinate);
    }
  };

  // Open external maps app for navigation.
  const handleNavigate = () => {
    if (!location || !destination) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open the navigation application.")
    );
  };

  // In-app share for live location.
  const handleShareLiveLocationInApp = () => {
    if (!location) {
      Alert.alert(
        "Location Unavailable",
        "Could not retrieve your current location."
      );
      return;
    }
    const liveLocationURL = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    Alert.alert(
      "Live Location Shared",
      `Your live location (${liveLocationURL}) has been shared with emergency contacts.`
    );
  };

  // Calculate straight-line distance.
  let distanceText = "";
  if (destination && location) {
    const distance = getDistanceFromLatLonInKm(
      location.latitude,
      location.longitude,
      destination.latitude,
      destination.longitude
    ).toFixed(2);
    distanceText = `Straight-line Distance: ${distance} km`;
  }

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
      {/* Search Bar with default text */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => handleSearch()}
        />
      </View>

      {/* Map Display */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        onPress={handleMapPress}
      >
        {/* Destination Marker */}
        {destination && (
          <Marker coordinate={destination} title="Destination" pinColor="red" />
        )}
        {/* Safe Places Markers */}
        {safePlaces.map((place, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            }}
            title={place.name}
            description={place.vicinity}
            pinColor="green"
            onPress={() => {
              const placeCoords = {
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
              };
              setDestination(placeCoords);
              setRegion({
                ...placeCoords,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
              if (location) fetchRoute(location, placeCoords);
            }}
          />
        ))}
        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#0000FF"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Info Overlay */}
      <View style={styles.infoContainer}>
        {destination && (
          <>
            <Text style={styles.distanceText}>{distanceText}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={handleNavigate} style={styles.button}>
                <Text style={styles.buttonText}>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShareLiveLocationInApp}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Share Live Location</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  searchBarContainer: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    zIndex: 3,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    elevation: 5,
  },
  searchInput: {
    height: 40,
    fontSize: 16,
  },
  infoContainer: {
    position: "absolute",
    top: 90,
    left: 20,
    right: 20,
    zIndex: 3,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    elevation: 5,
    alignItems: "center",
  },
  distanceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    backgroundColor: "#6A00FF",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
  },
});

export default LocationScreen1;
