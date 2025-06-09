import React, { useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  Alert,
  TouchableOpacity,
  Platform
} from 'react-native';
import logo from '../../assets/logo.png';
import ellipse from '../../assets/Ellipse.png';
import ellipseBottom from '../../assets/EllipseBottom.png';
import ellipseTwo from '../../assets/EllipseTwo.png';

import { PERMISSIONS, check, request, RESULTS, openSettings } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import { LocationContext } from '../../components/LocationContext/LocationContext'; // ✅ Import the context

const { width, height } = Dimensions.get('window');

const Welcome = ({ navigation }) => {
  const colorAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  const { setLocation } = useContext(LocationContext); // ✅ Use context to store location

  useEffect(() => {
    const checkRequestPermission = async () => {
      const permissionGranted = await requestLocationPermissions();
      if (permissionGranted) {
        getCurrentLocation();
      } else {
        Alert.alert(
          "Location Permission Required",
          "This app needs access to your location. Please allow it to continue.",
          [{ text: "OK" }]
        );
      }
    };

    checkRequestPermission();
  }, []);

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: 1,
      duration: 1500,
      delay: 1500,
      useNativeDriver: false,
    }).start(() => {
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 1500,
        delay: 500,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  async function requestLocationPermissions() {
    const permission = Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const result = await check(permission);

    if (result === RESULTS.GRANTED) {
      return true;
    }

    const newStatus = await request(permission);

    if (newStatus === RESULTS.GRANTED) {
      return true;
    } else if (newStatus === RESULTS.BLOCKED) {
      Alert.alert(
        'Enable Location Permission',
        'Please enable location access for this app in settings → Permissions → Location.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openSettings() },
        ]
      );
      return false;
    } else {
      Alert.alert('Permission Denied', 'Location permission is required for this feature.');
      return false;
    }
  }

  const getCurrentLocation = async () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('User Location:', latitude, longitude);
        setLocation({ latitude, longitude }); // ✅ Set in context
        // Alert.alert('Location Received', `Lat: ${latitude}, Lon: ${longitude}`);
      },
      (error) => {
        console.error('Error getting location:', error);
        Alert.alert('Location Error', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        forceRequestLocation: true,
        showLocationDialog: true,
      }
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={() => navigation.navigate('Login')}
    >
      <Animated.View
        style={[
          styles.animatedBg,
          {
            backgroundColor: colorAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(255, 255, 255, 1)', '#7680DE4D'],
            }),
          },
        ]}
      />

      <Image source={ellipse} style={styles.ellipseTop} />
      <Image source={ellipseTwo} style={styles.ellipseTop} />
      <Image source={ellipseBottom} style={styles.ellipseBottom} />

      <View style={styles.logoContainer}>
        <Image source={logo} style={styles.logo} />
      </View>

      <Animated.Text style={[styles.text, { opacity: textFadeAnim }]}>
        WELCOME
      </Animated.Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    position: 'relative',
  },
  animatedBg: {
    ...StyleSheet.absoluteFillObject,
    position: 'absolute',
  },
  logoContainer: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 210,
    height: 209,
    resizeMode: 'contain',
    borderRadius: 105,
  },
  text: {
    fontSize: 30,
    fontStyle: 'italic',
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },
  ellipseTop: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  ellipseBottom: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

export default Welcome;
