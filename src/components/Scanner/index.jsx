import React, { useState, useRef, useEffect, useContext } from 'react';
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
  Alert,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { LocationContext } from '../LocationContext/LocationContext';
import { getSocket } from '../../socket';

const Scanner = ({ navigation }) => {
  const [scannedData, setScannedData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const moveAnim = useRef(new Animated.Value(0)).current;

  const { location } = useContext(LocationContext);
  const fullName = `${scannedData?.firstName ?? ''} ${scannedData?.lastName ?? ''}`.trim();

  const isSuccessImage =
    connectionStatus === 'success' ||
    connectionStatus === 'already' ||
    failureReason.toLowerCase().includes('already');

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
    const socket = getSocket();
    console.log("🧩 Socket ID:", socket.id);

    socket.on('meeting_request', ({ fromUserId, eventId }) => {
      console.log("📩 Received meeting request from:", fromUserId, "for event:", eventId);

      Alert.alert(
        'Meeting Request',
        `User ${fromUserId} wants to connect with you!`,
        [
          {
            text: 'Accept',
            onPress: () => {
              console.log("✅ Meeting accepted");
              socket.emit('respond_meeting_request', {
                fromUserId,
                eventId,
                accept: true
              });
            },
          },
          {
            text: 'Decline',
            style: 'cancel',
            onPress: () => {
              console.log("❌ Meeting declined");
              socket.emit('respond_meeting_request', {
                fromUserId,
                eventId,
                accept: false
              });
            },
          },
        ]
      );
    });

    socket.on('write_meeting_notes', ({ meetingId }) => {
      console.log("📝 Navigate to MeetingNoteScreen with ID:", meetingId);
      navigation.navigate('MeetingNoteScreen', { meetingId });
    });

    socket.on('meeting_error', ({ message }) => {
      console.log("⚠️ Meeting error received:", message);
      setLoading(false);
      setConnectionStatus('fail');
      setFailureReason(message);
      setShowPopup(true);
    });

    return () => {
      socket.off('meeting_request');
      socket.off('write_meeting_notes');
      socket.off('meeting_error');
    };
  }, [navigation]);

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        console.log("⏱️ Resetting scanner after popup");
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
      console.log("📸 QR Code Scanned:", e.data);

      let data;
      try {
        data = JSON.parse(e.data);
        console.log("✅ Parsed QR Data:", data);
      } catch {
        console.log("❌ Invalid QR Code - Not JSON");
        setConnectionStatus('invalid');
        setFailureReason('Invalid QR code.');
        setShowPopup(true);
        return;
      }

      if (!data?.id) {
        console.log("❌ QR code missing user ID");
        setConnectionStatus('invalid');
        setFailureReason('QR Code missing user ID.');
        setShowPopup(true);
        return;
      }

      if (!location?.latitude || !location?.longitude) {
        console.log("📍 Location unavailable:", location);
        setConnectionStatus('fail');
        setFailureReason('Location not available. Please enable GPS and try again.');
        setShowPopup(true);
        return;
      }

      console.log("📍 Location:", location);
      setScannedData(data);

      const token = await AsyncStorage.getItem('token');
      console.log("🔑 Retrieved token:", token);

      const socket = getSocket();
      const payload = {
        targetUserId: data.id,
        latitude: location.latitude,
        longitude: location.longitude,
        token,
      };

      console.log("📡 Emitting scan_qr with:", payload);
      socket.emit('scan_qr', payload);
    } catch (error) {
      console.log("❌ Unexpected error during scan:", error);
      setConnectionStatus('fail');
      setFailureReason('Something went wrong. Please try again.');
      setShowPopup(true);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#34495e" />
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
            }}
          />
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
              {(connectionStatus === 'fail' || connectionStatus === 'invalid') && (
                <Text style={styles.warningHeader}>
                  {connectionStatus === 'invalid' ? 'Invalid QR Code' : 'Request Failed'}
                </Text>
              )}

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
  connect: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50
  }
});

export default Scanner;