import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

// Helper: Decodes an encoded polyline string returned by Google Directions API.
const decodePolyline = (t) => {
  let points = [];
  let index = 0, len = t.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

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
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const LocationScreen = () => {
  const [location, setLocation] = useState(null); // User's current location.
  const [destination, setDestination] = useState(null); // Selected destination.
  const [routeCoordinates, setRouteCoordinates] = useState([]); // Polyline coordinates for the driving route.
  const [region, setRegion] = useState(null); // Map region.
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  
  const mapRef = useRef(null);

  // Obtain the current device location on mount.
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied.');
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      // Set the initial region.
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setLoading(false);
    })();
  }, []);

  // Fetch a driving route from the origin (current location) to the destination using the Google Directions API.
  const fetchRoute = async (origin, dest) => {
    try {
      // Reset previous route
      setRouteCoordinates([]);
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destinationStr =` ${dest.latitude},${dest.longitude}`;
      const apiKey = "AIzaSyC7aFNoQf5cPA7Xbc7wEgn3DvB7mqEw1n4"; // Replace with your API key.
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${apiKey}&mode=driving`;
      const response = await fetch(url);
      const json = await response.json();

      console.log('Directions API response:', json);

      if (json.status !== 'OK' || !json.routes.length) {
        Alert.alert('No route found',` Could not find a route. (Status: ${json.status})`);
        return;
      }

      const encodedPolyline = json.routes[0].overview_polyline.points;
      const points = decodePolyline(encodedPolyline);
      setRouteCoordinates(points);
    } catch (error) {
      Alert.alert('Error fetching route', 'Something went wrong while fetching the route.');
      console.error(error);
    }
  };

  // Handle search submission: geocode the query, update destination, animate map, and fetch route.
  const handleSearch = async () => {
    if (!query) return;
    try {
      const results = await Location.geocodeAsync(query);
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        const destCoords = { latitude, longitude };
        setDestination(destCoords);
        // Update map region.
        setRegion({
          ...destCoords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...destCoords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
        if (location) {
          fetchRoute(location, destCoords);
        }
      } else {
        Alert.alert('Location not found', 'Please try another search term.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong with the search.');
      console.error(error);
    }
  };

  // Compute straight-line distance for display.
  let distanceText = '';
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
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location..."
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
      </View>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation={true}
      >
        {/* Destination marker */}
        {destination && (
          <Marker
            coordinate={destination}
            title="Destination"
            pinColor="red"
          />
        )}
        {/* Draw the route polyline along actual roads */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#0000FF"
            strokeWidth={4}
          />
        )}
      </MapView>
      {/* Info overlay showing distance */}
      <View style={styles.infoContainer}>
        {destination && (
          <Text style={styles.distanceText}>{distanceText}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  searchBarContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    zIndex: 3,
    backgroundColor: '#fff',
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
    position: 'absolute',
    top: 90,
    left: 20,
    right: 20,
    zIndex: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    elevation: 5,
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default LocationScreen;