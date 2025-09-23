import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useContext, useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Image,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {
  PERMISSIONS,
  RESULTS,
  check,
  openSettings,
  request,
  requestNotifications, // 🆕 for iOS notifications
} from 'react-native-permissions';
import logo from '../../assets/logo.png';
import { LocationContext } from '../../components/LocationContext/LocationContext';

// ✅ Modular Firebase imports
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  requestPermission,
} from '@react-native-firebase/messaging';

const Welcome = ({ navigation }) => {
  const colorAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  const { setLocation } = useContext(LocationContext);

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        BackHandler.exitApp();
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }, [])
  );

  useEffect(() => {
    const initialize = async () => {
      const locationGranted = await requestLocationPermissions();
      const fcmToken = await requestNotificationPermission();
      await requestCameraPermission();
      await requestStoragePermission();

      let coords = { latitude: null, longitude: null };

      if (locationGranted) {
        coords = await getCurrentLocation();
        setLocation(coords);
      }

      // Navigate immediately, no timer
      const savedToken = await AsyncStorage.getItem('token');
      if (savedToken) {
        navigation.replace('Layout', { screen: 'Home' });
      } else {
        navigation.replace('Login', { deviceToken: fcmToken ?? null });
      }
    };

    initialize();
  }, []);


  useEffect(() => {
    colorAnim.setValue(1);
    textFadeAnim.setValue(1);
  }, []);

  const requestLocationPermissions = async () => {
    const permission =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const askAgain = async () => {
      const newStatus = await request(permission);
      if (newStatus === RESULTS.GRANTED) {return true;}
      if (newStatus === RESULTS.BLOCKED) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permission from settings to proceed.',
          [{ text: 'Open Settings', onPress: () => openSettings() }]
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
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          ]
        );
      });
    };

    const result = await check(permission);
    return result === RESULTS.GRANTED ? true : await askAgain();
  };

  const requestCameraPermission = async () => {
    const permission =
      Platform.OS === 'android' ? PERMISSIONS.ANDROID.CAMERA : PERMISSIONS.IOS.CAMERA;

    const result = await request(permission);
    if (result === RESULTS.GRANTED) {return true;}

    Alert.alert(
      'Camera Permission',
      'Camera access is required to scan QR codes.',
      [{ text: 'OK' }]
    );
    return false;
  };

  const requestStoragePermission = async () => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
          if (result === RESULTS.GRANTED) {return true;}

          if (result === RESULTS.BLOCKED) {
            Alert.alert(
              'Storage Permission Blocked',
              'Please enable storage access from settings.',
              [
                { text: 'Open Settings', onPress: () => openSettings() },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }
          return false;
        } else {
          const write = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
          if (write === RESULTS.GRANTED) {return true;}

          if (write === RESULTS.BLOCKED) {
            Alert.alert(
              'Storage Permission Blocked',
              'Please enable storage access from settings.',
              [
                { text: 'Open Settings', onPress: () => openSettings() },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }
          return false;
        }
      } else {
        const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        if (result === RESULTS.GRANTED) {return true;}
        if (result === RESULTS.BLOCKED) {
          Alert.alert(
            'Photo Library Blocked',
            'Please enable photo library access from settings.',
            [
              { text: 'Open Settings', onPress: () => openSettings() },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }
        return false;
      }
    } catch (error) {
      console.error('Storage permission error:', error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {return null;}
    }

    if (Platform.OS === 'ios') {
      const { status } = await requestNotifications(['alert', 'sound', 'badge']);
      if (status !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in Settings to stay updated.',
          [{ text: 'OK' }]
        );
        return null;
      }
    }

    try {
      const app = getApp(); // ✅ fix missing reference
      const messaging = getMessaging(app);

      // Add platform check
      let token = null;
      if (Platform.OS === 'android') {
        await messaging.registerDeviceForRemoteMessages();
        await requestPermission(messaging);
        token = await getToken(messaging);
      } else {
        console.warn('Skipping FCM token on iOS — requires paid Apple Developer account.');
        Alert.alert('FCM Token', 'iOS FCM token skipped (requires paid Apple Developer account)');
      }

      return token ?? null;
    } catch (error) {
      console.error('FCM Token Error:', error);
      return null;
    }

  };


  const getCurrentLocation = () => {
    return new Promise((resolve) => {
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

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={styles.container}>
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
      </View>
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
