import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Modal, TouchableOpacity } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { ActivityIndicator } from 'react-native';
import { Animated, Easing } from 'react-native';
import { Vibration } from 'react-native';

const Scanner = () => {
  const [scannedData, setScannedData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null); // true / false
  const [showPopup, setShowPopup] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const scannerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const moveAnim = useRef(new Animated.Value(0)).current;
  const fullName = `${scannedData?.firstName ?? ''}${scannedData?.lastName ?? ''}`.trim();

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
        setShowPopup(false);        // hide popup after 3 sec
        setScanCompleted(false);    // reset scan state
        scannerRef.current?.reactivate();
      }, 3000);

      return () => clearTimeout(timer); // cleanup
    }
  }, [showPopup]);

  const onSuccess = async (e) => {
    Vibration.vibrate(150); // vibrate

    if (scanCompleted) return; // Prevent multiple scans

    try {
      setLoading(true);
      setScanCompleted(true); // Prevent re-trigger during processing

      const data = JSON.parse(e.data);

      setScannedData(data);
      await new Promise((res) => setTimeout(res, 2000)); // Show loader for at least 800ms

      // 🔗 Send scanned data to backend
      // const response = await axios.post('https://dummy-backend.com/check-connection', {
      //   scannedUserId: data.userId, 
      //   scannerId: currentUserId,
      // });

      // const { success } = Response.data; // true or false(responce.data)
      const success = false;
      setConnectionStatus(success);
      setShowPopup(true);
      // setScanCompleted(true);
    } catch (error) {
      console.log('Scan error:', error);
      setScanCompleted(false);
    }
    finally {
      setLoading(false); // ✅ End loading

    }
  };

  return (
    <View style={{ flex: 1 }}>

      {/* ✅ Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>


      <QRCodeScanner
        ref={scannerRef}
        onRead={onSuccess}
        showMarker={false}
        reactivate={false}
        vibrate={true}
        containerStyle={{ flex: 1 }}
        cameraStyle={{ height: 700 }}

      />

      {/* Custom Overlay Scanner Box */}
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
        <Text style={styles.centerText}>Connect New People</Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Checking connection...</Text>
          </View>
        </View>
      )}


      <Modal visible={showPopup} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>

            {!connectionStatus && (
              <Text style={styles.warningHeader}>you have no connection request</Text>
            )}

            <Image
              source={
                connectionStatus
                  ? require('../../assets/success.png')
                  : require('../../assets/notconnected.png')
              }
              style={styles.popupImage}
            />

            <Text
              style={[
                styles.popupText,
                { color: connectionStatus ? '#2ecc71' : '#000' },
              ]}
            >
              {connectionStatus
                ? 'Successfully Connected! 🎉'
                : 'Connection Not Allowed'}
            </Text>

            {scannedData && (
              <Text style={styles.userText}>
                User: {fullName.length > 15 ? fullName.substring(0, 15) + '...' : fullName}
              </Text>

            )}


          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },


  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    bottom: -100,
    left: '43%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    zIndex: 20,
    alignItems: 'center',
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
    borderColor: '#30D5C8', // Customize your color here (blue)
    borderWidth: 3,
    width: 250,
    height: 250,
    borderRadius: 16,
  },

  scannerBox: {
    width: 250,
    height: 250,
    top: -60,
    borderColor: '#34495e',
    borderWidth: 3,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },

  scannerLine: {
    width: '100%',
    height: 4,
    backgroundColor: '#34495e', // neon green
    position: 'absolute',
    //color:'#00FFFF',
    top: 0,
  },

  overlayContainer: {
    position: 'absolute',
    top: '35%', // adjust based on layout
    left: '50%',
    transform: [{ translateX: -125 }],
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  backButton: {
    position: 'absolute',
    top: 60, // adjust for status bar
    left: 20,
    zIndex: 100,
    backgroundColor: '#34495e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 4,
  },

  backButtonText: {
    color: '#fff',
    fontSize: 24,
    //fontWeight:200,
    fontWeight: 'bold',

  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 140,
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

})
export default Scanner;