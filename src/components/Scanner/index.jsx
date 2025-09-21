import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  Vibration,
  View,
} from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Camera, useCameraDevices, useCodeScanner } from 'react-native-vision-camera';
import { getSocket } from '../../socket';
import { LocationContext } from '../LocationContext/LocationContext';

const Scanner = ({ navigation }) => {
  const [scannedData, setScannedData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const moveAnim = useRef(new Animated.Value(0)).current;
  const loadingRef = useRef(false);
  const fallbackTriggered = useRef(false);
  const timeoutIdRef = useRef(null);

  const { location } = useContext(LocationContext);
  const fullName = `${scannedData?.firstName ?? ''} ${scannedData?.lastName ?? ''}`.trim();

  const isSuccessImage =
    connectionStatus === 'success' ||
    connectionStatus === 'already' ||
    failureReason.toLowerCase().includes('already');

  // ✅ Camera setup
  const devices = useCameraDevices();
  const device = devices.back || devices[0];

  // ✅ New code scanner hook
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        runOnJS(onSuccess)({ data: codes[0].value });
      }
    },
  });

  useEffect(() => {
    Animated.loop(
      Animated.timing(moveAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [moveAnim]);

  // ✅ Fixed socket setup & cleanup
  useEffect(() => {
    let activeSocket; // store socket reference for cleanup

    const setupSocket = async () => {
      try {
        const socket = await getSocket();
        if (!socket) return; // prevent crashes if null

        activeSocket = socket;

        socket.on('write_meeting_notes', ({ meetingId }) => {
          clearTimeout(timeoutIdRef.current);
          loadingRef.current = false;
          setLoading(false);
          setConnectionStatus('success');
          setShowPopup(true);
          setTimeout(() => {
            setShowPopup(false);
            navigation.navigate('MeetingNoteScreen', { meetingId });
          }, 2000);
        });

        socket.on('meeting_error', ({ message }) => {
          clearTimeout(timeoutIdRef.current);
          loadingRef.current = false;
          setLoading(false);
          setConnectionStatus('fail');
          setFailureReason(message);
          setShowPopup(true);
        });

        socket.on('meeting_declined', () => {
          clearTimeout(timeoutIdRef.current);
          loadingRef.current = false;
          setLoading(false);
          setConnectionStatus('fail');
          setFailureReason('Your meeting request was declined by');
          setShowPopup(true);
          setTimeout(() => {
            setShowPopup(false);
            setScanCompleted(false);
          }, 3000);
        });
      } catch (err) { }
    };

    setupSocket();

    return () => {
      try {
        if (activeSocket) {
          activeSocket.off('write_meeting_notes');
          activeSocket.off('meeting_error');
          activeSocket.off('meeting_declined');
        }
      } catch (err) { }
    };
  }, [navigation]);

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
        setScanCompleted(false);
        setFailureReason('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  const onSuccess = async (e) => {
    if (scanCompleted) return;

    Vibration.vibrate(150);

    try {
      setLoading(true);
      loadingRef.current = true;
      setScanCompleted(true);
      fallbackTriggered.current = false;

      let data;
      try {
        data = JSON.parse(e.data);
      } catch {
        setConnectionStatus('invalid');
        setFailureReason('Scanned code is not valid. Please try another.');
        setShowPopup(true);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      if (!data?.id) {
        setConnectionStatus('invalid');
        setFailureReason('Scanned code is not valid. Please try another.');
        setShowPopup(true);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      if (!location?.latitude || !location?.longitude) {
        setConnectionStatus('fail');
        setFailureReason('Please enable location and try again.');
        setShowPopup(true);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      setScannedData(data);

      const socket = await getSocket();
      if (!socket) {
        setConnectionStatus('fail');
        setFailureReason('Unable to connect to server. Please try again.');
        setShowPopup(true);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      const payload = {
        targetUserId: data.id,
        latitude: location.latitude,
        longitude: location.longitude,
      };
      socket.emit('scan_qr', payload);

      timeoutIdRef.current = setTimeout(() => {
        if (loadingRef.current && !fallbackTriggered.current) {
          fallbackTriggered.current = true;
          setLoading(false);
          setConnectionStatus('fail');
          setFailureReason('Unable to connect. No response from');
          setShowPopup(true);
        }
      }, 10000);
    } catch (error) {
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
      <StatusBar barStyle={useColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#e8effc' }}>
        <View style={{ flex: 1, backgroundColor: '#e8effc' }}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center', top: 70 }}>
            {device ? (
              <View
                style={{
                  height: 500,
                  width: 295,
                  borderRadius: 20,
                  overflow: 'hidden',
                }}
              >
                <Camera
                  style={{ flex: 1 }}
                  device={device}
                  isActive={true}
                  codeScanner={codeScanner}
                />
              </View>
            ) : (
              <ActivityIndicator size="large" color="#34495e" style={{ marginTop: 200 }} />
            )}
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
            <Text style={styles.centerText}>Scan to Connect New People</Text>
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
                  {connectionStatus === 'success' ? (
                    <>
                      Connection established with{' '}
                      <Text style={styles.userName}>
                        {fullName?.length > 12 ? fullName.substring(0, 12) + '...' : fullName}
                      </Text>
                    </>
                  ) : scannedData && fullName ? (
                    <>
                      {failureReason}{' '}
                      {failureReason.toLowerCase() !== "you're too far from the event." ? (
                        <Text style={styles.userName}>
                          {fullName.length > 12 ? fullName.substring(0, 12) + '...' : fullName}
                        </Text>
                      ) : (
                        ' '
                      )}
                    </>
                  ) : (
                    'Connection Not Allowed'
                  )}
                </Text>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    marginBottom: 16,
  },
  popupText: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  userText: { fontSize: 16, color: '#444', marginTop: 4, textAlign: 'center' },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontSize: 16 },
  scannerBox: {
    width: 250,
    height: 250,
    top: 0,
    borderColor: '#34495e',
    borderWidth: 3,
    borderRadius: 20,
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
    borderRadius: 20,
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
  loadingContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16, marginTop: 20 },
  centerText: {
    fontSize: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    color: '#000000',
    fontWeight: '600',
  },
  backButton: { paddingHorizontal: 12, paddingVertical: 12 },
  connect: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  userName: { fontWeight: 'bold' },
});

export default Scanner;
