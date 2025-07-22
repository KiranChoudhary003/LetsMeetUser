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
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [meetingRequestData, setMeetingRequestData] = useState(null);
  const loadingRef = useRef(false);
  const fallbackTriggered = useRef(false);
  const timeoutIdRef = useRef(null);


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
    let socket;

    const setupSocket = async () => {
      try {
        socket = await getSocket(); // ensures the socket is connected and authenticated
        console.log("🧩 Connected Socket ID:", socket.id);

        socket.on('meeting_request', ({ fromUserId, eventId }) => {
          console.log("📩 Received meeting request from:", fromUserId);
          setMeetingRequestData({ fromUserId, eventId });
          setShowAcceptModal(true);
        });

        socket.on('write_meeting_notes', ({ meetingId }) => {
          console.log("📝 Navigate to MeetingNoteScreen with ID:", meetingId);
          setLoading(false); // make sure to stop loader
          setConnectionStatus('success');
          setShowPopup(true);
          navigation.navigate('MeetingNoteScreen', { meetingId });
        });

        socket.on('meeting_error', ({ message }) => {
          console.log("⚠️ Meeting error received:", message);
          setLoading(false);
          setConnectionStatus('fail');
          setFailureReason(message);
          setShowPopup(true);
        });

        socket.on('meeting_declined', ({ by }) => {
          console.log(`❌ Meeting declined by user ${by}`);
          setLoading(false);
          setConnectionStatus('fail');
          setFailureReason('Your meeting request was declined.');
          setShowPopup(true);

          // Optional: Close scanner and go back after 3 seconds
          setTimeout(() => {
            setShowPopup(false);
            setScanCompleted(false);
            scannerRef.current?.reactivate(); // or navigate.goBack() if you prefer exit
            // navigation.goBack(); // <- uncomment if you want to leave scanner
          }, 3000);
        });

      } catch (err) {
        console.error("❌ Socket setup failed:", err.message);
      }
    };

    setupSocket();

    return () => {
      try {
        const socket = getSocket();
        socket.off('meeting_request');
        socket.off('write_meeting_notes');
        socket.off('meeting_error');
        socket.off('meeting_declined');
      } catch (err) {
        console.warn("⚠️ Cleanup failed: socket not initialized");
      }
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
      loadingRef.current = true;
      setScanCompleted(true);
      fallbackTriggered.current = false;

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
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      if (!data?.id) {
        console.log("❌ QR code missing user ID");
        setConnectionStatus('invalid');
        setFailureReason('QR Code missing user ID.');
        setShowPopup(true);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      if (!location?.latitude || !location?.longitude) {
        console.log("📍 Location unavailable:", location);
        setConnectionStatus('fail');
        setFailureReason('Location not available. Please enable GPS and try again.');
        setShowPopup(true);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      setScannedData(data);
      const token = await AsyncStorage.getItem('token');
      console.log("🔑 Retrieved token:", token);

      const socket = await getSocket(); // ✅ Use correct socket init
      const payload = {
        targetUserId: data.id,
        latitude: location.latitude,
        longitude: location.longitude,
      };
      console.log("📡 Emitting scan_qr with:", payload);
      socket.emit('scan_qr', payload);

      // Set fallback timeout
      timeoutIdRef.current = setTimeout(() => {
        if (loadingRef.current && !fallbackTriggered.current) {
          console.warn("⏳ No response within timeout. Showing failure.");
          fallbackTriggered.current = true;
          setLoading(false);
          setConnectionStatus('fail');
          setFailureReason('No response. Try again.');
          setShowPopup(true);
        }
      }, 10000);
    } catch (error) {
      console.log("❌ Unexpected error during scan:", error);
      setConnectionStatus('fail');
      setFailureReason('Something went wrong. Please try again.');
      setShowPopup(true);
      setLoading(false);
      loadingRef.current = false;
      clearTimeout(timeoutIdRef.current);
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
                  ? `Connection established with ${fullName || 'user'}`
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

        <Modal
          visible={showAcceptModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAcceptModal(false)}
        >
          <View style={styles.popupOverlay}>
            <View style={styles.popupContainer}>
              <Text style={styles.popupText}>You have a new meeting request!</Text>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#2ecc71' }]}
                  onPress={async () => { // ✅ mark as async
                    try {
                      const socket = await getSocket(); // ✅ now allowed
                      socket.emit('respond_meeting_request', {
                        fromUserId: meetingRequestData?.fromUserId,
                        eventId: meetingRequestData?.eventId,
                        accept: true,
                      });
                      console.log("✅ Meeting accepted");
                      setShowAcceptModal(false);
                      setLoading(false);
                      Alert.alert('Success', 'Meeting accepted');
                    } catch (err) {
                      console.error("❌ Failed to respond to meeting request:", err);
                      Alert.alert('Error', 'Unable to accept the meeting.');
                    }
                  }}
                >
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>


                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#e74c3c' }]}
                  onPress={async () => { // ✅ mark as async
                    try {
                      const socket = await getSocket(); // ✅
                      socket.emit('respond_meeting_request', {
                        fromUserId: meetingRequestData?.fromUserId,
                        eventId: meetingRequestData?.eventId,
                        accept: false,
                      });
                      console.log("❌ Meeting declined");
                      setShowAcceptModal(false);
                      setLoading(false);
                    } catch (err) {
                      console.error("❌ Failed to decline meeting:", err);
                      Alert.alert('Error', 'Unable to decline the meeting.');
                    }
                  }}
                >
                  <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>

              </View>
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