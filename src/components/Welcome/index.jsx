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
} from 'react-native';
import logo from '../../assets/logo.png';
import { PERMISSIONS, check, request, RESULTS, openSettings } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import { LocationContext } from '../../components/LocationContext/LocationContext';
import messaging from '@react-native-firebase/messaging';

const { width, height } = Dimensions.get('window');

const Welcome = ({ navigation }) => {
  const colorAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  const { setLocation } = useContext(LocationContext);
  const [deviceToken, setDeviceToken] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const locationGranted = await requestLocationPermissions();
      if (locationGranted) {
        getCurrentLocation();
      }

      const token = await requestNotificationPermission();
      if (token) {
        setDeviceToken(token);
        console.log('✅ FCM Device Token:', token);
      }
    };

    initialize();
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

  const requestLocationPermissions = async () => {
    const permission = Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const result = await check(permission);
    if (result === RESULTS.GRANTED) return true;

    const newStatus = await request(permission);
    if (newStatus === RESULTS.GRANTED) return true;

    if (newStatus === RESULTS.BLOCKED) {
      Alert.alert('Enable Location Permission', 'Please enable location in app settings.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => openSettings() },
      ]);
    } else {
      Alert.alert('Permission Denied', 'Location permission is required.');
    }
    return false;
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
      },
      (error) => {
        console.error('Location error:', error);
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

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'Push Notification permission is required.');
        return null;
      }
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      try {
        const token = await messaging().getToken();
        return token;
      } catch (error) {
        console.log('❌ Error getting FCM token:', error);
        Alert.alert('Notification Error', 'Unable to get notification token');
      }
    } else {
      Alert.alert('Permission Denied', 'Push Notification permission is required.');
    }

    return null;
  };

  const handleContinue = () => {
    if (!deviceToken) {
      Alert.alert('Please Wait', 'Device token is still being generated...');
      return;
    }
    navigation.navigate('Login', { deviceToken });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={handleContinue} // ✅ use correct handler
    >
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'e8effc',
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
