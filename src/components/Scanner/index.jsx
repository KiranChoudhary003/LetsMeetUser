import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { RNCamera } from 'react-native-camera';

const Scanner = () => {
  const [hasPermission, setHasPermission] = useState(null); // null = loading
  const [scanned, setScanned] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    const requestCameraPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'App needs camera access to scan QR codes.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        } catch (err) {
          console.warn(err);
          setHasPermission(true);
        }
      } else {
        setHasPermission(true); // iOS permission handled differently
      }
    };

    requestCameraPermission();
  }, []);

  const handleBarCodeRead = ({ data }) => {
    if (!scanned) {
      setScanned(true);
      Alert.alert('QR Code Scanned', data, [
        {
          text: 'Scan Again',
          onPress: () => setScanned(false),
        },
      ]);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#00FF00" />
        <Text style={styles.loadingText}>Checking camera permission...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.errorText}>Camera permission denied. Please enable it in settings.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RNCamera
        style={styles.preview}
        onBarCodeRead={handleBarCodeRead}
        captureAudio={false}
        type={RNCamera.Constants.Type.back}
        onCameraReady={() => setCameraReady(true)}
      >
        <View style={styles.rectangle} />
        {!cameraReady && <Text style={styles.loadingText}>Loading camera...</Text>}
      </RNCamera>
    </View>
  );
};

export default Scanner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  preview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rectangle: {
    height: 250,
    width: 250,
    borderWidth: 2,
    borderColor: '#00FF00',
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
})