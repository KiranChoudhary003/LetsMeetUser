import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
  Vibration,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Scanner = ({ navigation }) => {
  const [scannedData, setScannedData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const moveAnim = useRef(new Animated.Value(0)).current;
  const isSuccessImage =
    connectionStatus === 'success' ||
    connectionStatus === 'already' ||
    failureReason.toLowerCase().includes('already') ||
    failureReason.toLowerCase().includes('connection already exists');
  const fullName = `${scannedData?.firstName ?? ''} ${scannedData?.lastName ?? ''}`.trim();

  useEffect(() => {
    Animated.loop(
      Animated.timing(moveAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
        setScanCompleted(false);
        setFailureReason('');
        scannerRef.current?.reactivate();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  const onSuccess = async (e) => {
    Vibration.vibrate(150);
    if (scanCompleted) return;

    try {
      setLoading(true);
      setScanCompleted(true);

      let data;
      try {
        data = JSON.parse(e.data);
      } catch {
        setScannedData(null);
        setConnectionStatus('invalid');
        setFailureReason('The scanned QR code is not valid.');
        setShowPopup(true);
        return;
      }

      if (!data?.id) {
        setScannedData(null);
        setConnectionStatus('invalid');
        setFailureReason('Invalid QR code.');
        setShowPopup(true);
        return;
      }

      setScannedData(data);
      const receiverId = data.id;
      const token = await AsyncStorage.getItem('token');

      const response = await axios.post(
        'https://letsmeet-backend-47lv.onrender.com/api/user-connections/send-request',
        { receiver_id: receiverId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const resData = response.data;
      if (resData?.message === 'Already connected' || resData?.alreadyConnected) {
        setConnectionStatus('already');
        setFailureReason('You are already connected with this user.');
      } else if (resData?.message === 'Request already sent') {
        setConnectionStatus('already');

        setFailureReason('You already sent a request to this user.');
      } else if (response.status === 200) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('fail');
        setFailureReason('Unexpected response. Please try again.');
      }
    } catch (error) {

      const errorMessage = error?.response?.data?.message;

      if (
        errorMessage === 'Connection already exists' ||
        error?.response?.data?.alreadyConnected
      ) {
        setConnectionStatus('already');
        setFailureReason('You are already connected with this user.');
      } else if (errorMessage === 'Request already sent') {
        setConnectionStatus('already');
        setFailureReason('You already sent a request to this user.');
      } else if (errorMessage === 'You cannot connect to yourself') {
        setConnectionStatus('fail');
        setFailureReason('You cannot connect with your own profile.');
      } else if (errorMessage) {
        setConnectionStatus('fail');
        setFailureReason(errorMessage);
      } else {
        setConnectionStatus('fail');
        setFailureReason('Something went wrong. Please try again.');
      }


    } finally {
      setLoading(false);
      setShowPopup(true);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#34495e" translucent={false} />
      <View style={{ flex: 1, backgroundColor: '#e8effc' }}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <QRCodeScanner
            ref={scannerRef}
            onRead={onSuccess}
            showMarker={false}
            reactivate={false}
            vibrate={true}
            containerStyle={{ width: 295 }}
            cameraStyle={{
              height: 485,
              width: '100%',
              borderRadius: 20,
              overflow: 'hidden',
            }} />
        </View>

        <View style={styles.overlayContainer}>
          <View style={styles.scannerBox}>
            <Animated.View
              style={[
                styles.scannerLine,
                {
                  transform: [
                    {
                      translateY: moveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 250],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>

        </View>
        <View style={styles.connect}>
          <Text style={styles.centerText}>Connect New People</Text>
        </View>
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#34495e" />
              <Text style={styles.loadingText}>Checking connection...</Text>
            </View>
          </View>
        )}

        <Modal visible={showPopup} transparent animationType="fade">
          <View style={styles.popupOverlay}>
            <View style={styles.popupContainer}>
              {connectionStatus === 'fail' || connectionStatus === 'invalid' ? (
                <Text style={styles.warningHeader}>
                  {connectionStatus === 'invalid' ? 'Invalid QR Code' : 'Request Already Sent'}
                </Text>
              ) : null}

              <Image
                source={
                  isSuccessImage
                    ? require('../../assets/success.png')
                    : require('../../assets/notconnected.png')
                }
                style={styles.popupImage}
              />

              <Text
                style={[
                  styles.popupText,
                  {
                    color:
                      connectionStatus === 'success'
                        ? '#2ecc71'
                        : connectionStatus === 'invalid'
                          ? 'red'
                          : '#000',
                  },
                ]}
              >
                {connectionStatus === 'success'
                  ? 'Request Sent Successfully!'
                  : failureReason || 'Connection Not Allowed'}
              </Text>

              {failureReason !== '' && connectionStatus !== 'success' && (
                <Text style={styles.failureReasonText}>{failureReason}</Text>
              )}

              {scannedData && fullName && (
                <Text style={styles.userText}>
                  User: {fullName.length > 12 ? fullName.substring(0, 12) + '...' : fullName}
                </Text>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 16,
    alignItems: 'center',
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },

  warningHeader: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },

  popupImage: {
    width: 140,
    height: 140,
    marginBottom: 16
  },

  popupText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',

  },

  userText: {
    fontSize: 16,
    color: '#444',
    marginTop: 4,
    textAlign: 'center',
  },

  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
  },

  customMarker: {
    borderColor: '#30D5C8',
    borderWidth: 3,
    width: 250,
    height: 250,
    borderRadius: 16,
  },

  scannerBox: {
    width: 250,
    height: 250,
    top: 0,
    borderColor: '#34495e',
    borderWidth: 3,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },

  scannerLine: {
    width: '100%',
    height: 4,
    backgroundColor: '#34495e',
    position: 'absolute',
    top: 0,
  },

  overlayContainer: {
    position: 'absolute',
    top: '32%',
    left: '50%',
    transform: [{ translateX: -125 }],
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  loadingOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    bottom: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },

  loadingContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
  },

  centerText: {
    fontSize: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#34495e',
    borderRadius: 12,
    color: '#fff',
    fontWeight: '600',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    paddingLeft: 20,
    marginTop: 20,
  },
  connect : {
    display : "flex",
    alignItems : "center",
    justifyContent : "center",
    marginBottom : 50
  }
});

export default Scanner;