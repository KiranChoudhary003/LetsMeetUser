import React, { useEffect, useRef, useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  Alert,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  StatusBar,
} from 'react-native';
import logo from '../../assets/logo.png';
import { PERMISSIONS, check, request, RESULTS, openSettings } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import { LocationContext } from '../../components/LocationContext/LocationContext';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Welcome = ({ navigation }) => {
  const colorAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  const { setLocation } = useContext(LocationContext);
  const [locationData, setLocationData] = useState({ latitude: null, longitude: null });

  useEffect(() => {
    const initialize = async () => {
      const locationGranted = await requestLocationPermissions();
      let coords = { latitude: null, longitude: null };

      if (locationGranted) {
        coords = await getCurrentLocation();
        setLocation(coords);
        setLocationData(coords);
      }

      const fcmToken = await requestNotificationPermission();

      if (!fcmToken) {
        console.warn('No FCM token available. Proceeding with null token.');
      }

      setTimeout(async () => {
        const savedToken = await AsyncStorage.getItem('token');

        if (savedToken) {
          navigation.replace('Layout', { screen: 'Home' });
        } else {
          navigation.replace('Login', {
            deviceToken: fcmToken ?? null
          });
        }
      }, 3000);
    };

    initialize();
  }, []);

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: 1,
      duration: 1000,
      delay: 1000,
      useNativeDriver: false,
    }).start(() => {
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 500,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const requestLocationPermissions = async () => {
    const permission = Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const askAgain = async () => {
      const newStatus = await request(permission);

      if (newStatus === RESULTS.GRANTED) return true;

      if (newStatus === RESULTS.BLOCKED) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permission from settings to proceed.',
          [
            { text: 'Open Settings', onPress: () => openSettings() },
          ]
        );
        return false;
      }

      return new Promise((resolve) => {
        Alert.alert(
          'Location Required',
          'This app requires location access to continue.',
          [
            {
              text: 'Try Again',
              onPress: async () => {
                const result = await askAgain();
                resolve(result);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false),
            },
          ]
        );
      });
    };

    const result = await check(permission);

    if (result === RESULTS.GRANTED) return true;

    return await askAgain();
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        (error) => {
          Alert.alert('Location Error', error.message);
          resolve({ latitude: null, longitude: null });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          forceRequestLocation: true,
          showLocationDialog: true,
        }
      );
    });
  };
  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        return null;
      }
    }

    try {
      const authStatus = await messaging().requestPermission();

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        return null;
      }

      const token = await messaging().getToken();
      return token ?? null;
    } catch (error) {
      console.error('FCM Token Error:', error);
      return null;
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#34495e" translucent={false} />
      <TouchableOpacity style={styles.container} activeOpacity={1}>
        <Animated.View
          style={[
            styles.animatedBg,
            {
              backgroundColor: colorAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(255, 255, 255, 1)', '#34495e'],
              }),
            },
          ]}
        />
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} />
        </View>
        <Animated.Text style={[styles.text, { opacity: textFadeAnim }]}>
          WELCOME
        </Animated.Text>
      </TouchableOpacity>
    </>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8effc',
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
});
