import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, Alert, TouchableOpacity, Linking } from 'react-native';
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
  const [location, setLocation] = useState(null);             // User's current location.
  const [destination, setDestination] = useState(null);       // Destination coordinate.
  const [routeCoordinates, setRouteCoordinates] = useState([]); // Driving route polyline.
  const [region, setRegion] = useState(null);                   // Map region.
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [safePlaces, setSafePlaces] = useState([]);             // Array of nearby safe places.

  // For demonstration, assume these are your emergency contacts:
  const [emergencyContacts] = useState([
    { id: 1, name: 'John Doe', phone: '+1234567890' },
    { id: 2, name: 'Jane Smith', phone: '+1987654321' }
  ]);

  const mapRef = useRef(null);
  const GOOGLE_API_KEY = "AIzaSyCc2Oa-tvEn_57DthaLy92bLWoGeGF49sE"; // Replace with your valid API key.

  // Obtain current device location on mount.
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied.');
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setLoading(false);
    })();
  }, []);

  // Fetch a driving route from origin to destination using Google Directions API.
  const fetchRoute = async (origin, dest) => {
    try {
      setRouteCoordinates([]); // Reset previous route.
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destinationStr = `${dest.latitude},${dest.longitude}`;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_API_KEY}&mode=driving`;
      const response = await fetch(url);
      const json = await response.json();

      console.log('Directions API response:', json);

      if (json.status !== 'OK' || !json.routes.length) {
        Alert.alert('No route found', `Could not find a route. (Status: ${json.status})`);
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

  // Fetch nearby safe places using Google Places API.
  // Prioritized: police stations and hospitals first, then shopping malls.
  const fetchSafePlaces = async () => {
    if (!location) return;
    try {
      const radius = 5000; // search within 5km radius (adjust as needed)
      const baseUrl = ` https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=${radius}&key=${GOOGLE_API_KEY}`;
      let combinedResults = [];
      // Priority order: police, hospital, then shopping mall.
      const types = ["police", "hospital", "shopping_mall"];
      
      for (let type of types) {
        const url = `${baseUrl}&type=${type}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.results) {
          // Maintain order by concatenating results sequentially.
          combinedResults = combinedResults.concat(data.results);
        }
      }
      setSafePlaces(combinedResults);
    } catch (error) {
      Alert.alert('Error fetching safe places', 'Something went wrong while fetching safe places.');
      console.error(error);
    }
  };

  // Handle search submission: either geocode for a specific destination or fetch safe places.
  const handleSearch = async () => {
    const lowerQuery = query.toLowerCase().trim();
    if (!query) return;

    if (lowerQuery.includes('safe')) {
      // If the query relates to safe places, fetch nearby safe places.
      setDestination(null); // Clear any single destination.
      setRouteCoordinates([]);
      await fetchSafePlaces();
      // Optionally, update map region or animate to show markers.
      if (mapRef.current && location) {
        mapRef.current.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }
    } else {
      // Normal search: geocode the query to get a destination.
      try {
        const results = await Location.geocodeAsync(query);
        if (results && results.length > 0) {
          const { latitude, longitude } = results[0];
          const destCoords = { latitude, longitude };
          setDestination(destCoords);
          setSafePlaces([]); // Clear safe places markers.
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
    }
  };

  // Handle tap on map to set destination and fetch driving route.
  const handleMapPress = (event) => {
    const tappedCoordinate = event.nativeEvent.coordinate;
    setDestination(tappedCoordinate);
    setSafePlaces([]); // Clear any safe places markers.
    setRegion({
      ...tappedCoordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...tappedCoordinate,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
    if (location) {
      fetchRoute(location, tappedCoordinate);
    }
  };

  // Open the external maps application with navigation directions.
  const handleNavigate = () => {
    if (!location || !destination) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
    Linking.openURL(url).catch(err =>
      Alert.alert('Error', 'Could not open the navigation application.')
    );
  };

  // New: In-app live location sharing to emergency contacts.
  // In a real implementation, you might send these messages via an API or display them in an in-app chat.
  // For this demo, we'll simulate sending the location and then show an alert.
  const handleShareLiveLocationInApp = () => {
    if (!location) {
      Alert.alert('Location Unavailable', 'Could not retrieve your current location.');
      return;
    }
    
    // Construct a location message using a Google Maps link.
    const liveLocationURL =` https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    
    // Simulate sending this message to each emergency contact.
    emergencyContacts.forEach(contact => {
      console.log(`Sending live location to ${contact.name} (${contact.phone}): ${liveLocationURL}`);
      // Replace the above console.log with your actual in-app message delivery logic,
      // such as making an API call to your backend service.
    });
    
    // After sending, show an alert indicating successful sharing.
    Alert.alert('Live Location Shared',` Your live location has been shared with: ${emergencyContacts.map(c => c.name).join(', ')}`);
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
          placeholder="Search location or safe places..."
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
        onPress={handleMapPress}  // Handle map tap
      >
        {/* Destination marker */}
        {destination && (
          <Marker
            coordinate={destination}
            title="Destination"
            pinColor="red"
          />
        )}
        {/* Safe places markers */}
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
          />
        ))}
        {/* Draw the route polyline along actual roads */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#0000FF"
            strokeWidth={4}
          />
        )}
      </MapView>
      
      {/* Info overlay showing distance, navigation, and live location sharing */}
      <View style={styles.infoContainer}>
        {destination && (
          <>
            <Text style={styles.distanceText}>{distanceText}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={handleNavigate} style={styles.button}>
                <Text style={styles.buttonText}>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShareLiveLocationInApp} style={styles.button}>
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
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#6A00FF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default LocationScreen;