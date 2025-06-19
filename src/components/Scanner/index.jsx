import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
  Animated,
  Easing,
  InteractionManager,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import axios from 'axios';

const Scanner = ({ navigation }) => {
  const [scannedData, setScannedData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null); // true / false
  const [showPopup, setShowPopup] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false); // 👈 New state
  const scannerRef = useRef(null);
  const moveAnim = useRef(new Animated.Value(0)).current;

  const fullName = `${scannedData?.firstName ?? ''} ${scannedData?.lastName ?? ''}`.trim();

// import { InteractionManager } from 'react-native';

// ...

useEffect(() => {
  const interactionHandle = InteractionManager.runAfterInteractions(() => {
    setIsAppReady(true);
  });

  return () => interactionHandle.cancel();
}, []);


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

      const data = JSON.parse(e.data);
      setScannedData(data);

      await new Promise((res) => setTimeout(res, 2000)); // simulate API delay

      // Example API call
      // const response = await axios.post('https://your-api.com/check-connection', {
      //   scannedUserId: data.userId,
      //   scannerId: currentUserId,
      // });
      // const success = response.data.success;

      const success = false; // 🔧 replace with real API result
      setConnectionStatus(success);
      setShowPopup(true);
    } catch (error) {
      console.log('Scan error:', error);
      setScanCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 🔙 Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {/* QR Code Scanner - render after short delay */}
      {isAppReady && (
        <QRCodeScanner
          ref={scannerRef}
          onRead={onSuccess}
          showMarker={false}
          reactivate={false}
          vibrate={true}
          containerStyle={{ flex: 1 }}
          cameraStyle={{ height: 700 }}
        />
      )}

      {/* 📦 Overlay */}
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

      {/* 🔄 Loader */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Checking connection...</Text>
          </View>
        </View>
      )}

      {/* ✅ / ❌ Result Popup */}
      <Modal visible={showPopup} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            {!connectionStatus && (
              <Text style={styles.warningHeader}>You have no connection request</Text>
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

export default Scanner;

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: '#000',
    padding: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  overlayContainer: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    alignItems: 'center',
  },
  scannerBox: {
    height: 250,
    width: 250,
    borderWidth: 2,
    borderColor: '#00FF00',
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  scannerLine: {
    height: 2,
    backgroundColor: '#00FF00',
    width: '100%',
  },
  centerText: {
    marginTop: 20,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: 300,
    alignItems: 'center',
  },
  popupImage: {
    width: 100,
    height: 100,
    marginVertical: 10,
  },
  popupText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  userText: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  warningHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'red',
  },
});


// // QRScanner.js
// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, Alert } from 'react-native';
// import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
// import { scanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';
// import { runOnJS } from 'react-native-reanimated';

// const Scanner = ({ user }) => {
//   const [hasPermission, setHasPermission] = useState(false);
//   const devices = useCameraDevices();
//   const device = devices.back;

//   useEffect(() => {
//     (async () => {
//       const status = await Camera.getCameraPermissionStatus();
//       if (status !== 'authorized') {
//         const newStatus = await Camera.requestCameraPermission();
//         setHasPermission(newStatus === 'authorized');
//       } else {
//         setHasPermission(true);
//       }
//     })();
//   }, []);

//   const handleBarcodes = (barcodes) => {
//     if (barcodes.length > 0) {
//       const content = barcodes[0]?.displayValue;
//       if (content) {
//         let resultData;
//         try {
//           resultData = JSON.parse(content);
//         } catch {
//           resultData = { raw: content };
//         }

//         const result = {
//           scannedByUserId: user.id,
//           scannedByUserName: user.name,
//           qrData: resultData,
//         };

//         Alert.alert("Scan Result", JSON.stringify(result, null, 2));
//         console.log(result);
//       }
//     }
//   };

//   const frameProcessor = useFrameProcessor((frame) => {
//     'worklet';
//     const barcodes = scanBarcodes(frame, [BarcodeFormat.QR_CODE]);
//     runOnJS(handleBarcodes)(barcodes);
//   }, []);

//   if (!device || !hasPermission) {
//     return (
//       <View style={styles.center}>
//         <Text>{!hasPermission ? 'Requesting camera permission...' : 'Camera not ready yet...'}</Text>
//       </View>
//     );
//   }

//   return (
//     <Camera
//       style={StyleSheet.absoluteFill}
//       device={device}
//       isActive={true}
//       frameProcessor={frameProcessor}
//       frameProcessorFps={5}
//     />
//   );
// };

// export default Scanner;

// const styles = StyleSheet.create({
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Vibration,
//   PermissionsAndroid,
//   Platform,
//   Modal,
//   Image,
//   ActivityIndicator,
// } from 'react-native';
// import { Camera, useCameraDevices } from 'react-native-vision-camera';
// import { useScanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';
// import Icon from 'react-native-vector-icons/MaterialIcons';

// const Scanner = ({ navigation }) => {
//   const devices = useCameraDevices();
//   const device = devices.back;

//   const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE]);
//   const [hasPermission, setHasPermission] = useState(false);
//   const [showPopup, setShowPopup] = useState(false);
//   const [scannedData, setScannedData] = useState(null);
//   const [connectionStatus, setConnectionStatus] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const fullName = `${scannedData?.firstName ?? ''} ${scannedData?.lastName ?? ''}`.trim();

//   useEffect(() => {
//     const getPermission = async () => {
//       const status = await Camera.requestCameraPermission();
//       setHasPermission(status === 'authorized');
//     };
//     getPermission();
//   }, []);

//   useEffect(() => {
//     if (barcodes.length > 0 && !loading && !showPopup) {
//       const qrValue = barcodes[0]?.rawValue;
//       if (qrValue) handleScan(qrValue);
//     }
//   }, [barcodes]);

//   const handleScan = async (data) => {
//     Vibration.vibrate(150);
//     try {
//       setLoading(true);
//       const parsedData = JSON.parse(data);
//       setScannedData(parsedData);

//       // const res = await axios.post('your-backend-url', {...});
//       const success = false; // replace with API response
//       setConnectionStatus(success);
//       setShowPopup(true);
//       setTimeout(() => {
//         setShowPopup(false);
//         setScannedData(null);
//       }, 3000);
//     } catch (err) {
//       console.log('Invalid QR or scan error', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (device == null || !hasPermission) {
//     return <ActivityIndicator size="large" color="#000" />;
//   }

//   return (
//     <View style={{ flex: 1 }}>
//       <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//         <Icon name="arrow-back" size={28} color="#000" />
//       </TouchableOpacity>

//       <Camera
//         style={StyleSheet.absoluteFill}
//         device={device}
//         isActive={true}
//         frameProcessor={frameProcessor}
//         frameProcessorFps={5}
//       />

//       <View style={styles.overlay}>
//         <Text style={styles.centerText}>Connect New People</Text>
//       </View>

//       <Modal visible={showPopup} transparent animationType="fade">
//         <View style={styles.popupOverlay}>
//           <View style={styles.popupContainer}>
//             {!connectionStatus && (
//               <Text style={styles.warningHeader}>You have no connection request</Text>
//             )}
//             <Image
//               source={
//                 connectionStatus
//                   ? require('../../assets/success.png')
//                   : require('../../assets/notconnected.png')
//               }
//               style={styles.popupImage}
//             />
//             <Text
//               style={[
//                 styles.popupText,
//                 { color: connectionStatus ? '#2ecc71' : '#000' },
//               ]}
//             >
//               {connectionStatus
//                 ? 'Successfully Connected! 🎉'
//                 : 'Connection Not Allowed'}
//             </Text>
//             {scannedData && (
//               <Text style={styles.userText}>
//                 User: {fullName.length > 15 ? fullName.substring(0, 15) + '...' : fullName}
//               </Text>
//             )}
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   loadingOverlay: {
//     position: 'absolute',
//     top: '50%',
//     bottom: -100,
//     left: '43%',
//     transform: [{ translateX: -40 }, { translateY: -40 }],
//     zIndex: 20,
//     alignItems: 'center',
//   },
//   popupOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   popupContainer: {
//     backgroundColor: '#fff',
//     padding: 25,
//     borderRadius: 16,
//     alignItems: 'center',
//     width: 320,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     elevation: 8,
//   },

//   warningHeader: {
//     fontSize: 16,
//     color: '#e74c3c',
//     fontWeight: '600',
//     marginBottom: 12,
//     textAlign: 'center',
//   },

//   popupImage: {
//     width: 140,
//     height: 140,
//     marginBottom: 16
//   },

//   popupText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 8,
//     textAlign: 'center',

//   },

//   userText: {
//     fontSize: 16,
//     color: '#444',
//     marginTop: 4,
//     textAlign: 'center',
//   },

//   button: {
//     backgroundColor: '#007AFF',
//     paddingVertical: 10,
//     paddingHorizontal: 25,
//     borderRadius: 8,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//   },

//   customMarker: {
//     borderColor: '#30D5C8', // Customize your color here (blue)
//     borderWidth: 3,
//     width: 250,
//     height: 250,
//     borderRadius: 16,
//   },

//   scannerBox: {
//     width: 250,
//     height: 250,
//     top: -60,
//     borderColor: '#34495e',
//     borderWidth: 3,
//     borderRadius: 16,
//     overflow: 'hidden',
//     position: 'relative',
//   },

//   scannerLine: {
//     width: '100%',
//     height: 4,
//     backgroundColor: '#34495e', // neon green
//     position: 'absolute',
//     //color:'#00FFFF',
//     top: 0,
//   },

//   overlayContainer: {
//     position: 'absolute',
//     top: '35%', // adjust based on layout
//     left: '50%',
//     transform: [{ translateX: -125 }],
//     width: 250,
//     height: 250,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },

//   backButton: {
//     position: 'absolute',
//     top: 60, // adjust for status bar
//     left: 20,
//     zIndex: 100,
//     backgroundColor: '#34495e',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     elevation: 4,
//   },

//   backButtonText: {
//     color: '#fff',
//     fontSize: 24,
//     //fontWeight:200,
//     fontWeight: 'bold',

//   },
//   loadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 140,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 9999,
//     pointerEvents: 'none',
//   },

//   loadingContent: {
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   loadingText: {
//     color: '#fff',
//     fontSize: 16,
//     marginTop: 20,
//   },

//   centerText: {
//     fontSize: 20,
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     backgroundColor: '#34495e',
//     borderRadius: 12,
//     color: '#fff',
//     fontWeight: '600',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 3,
//   },

// });

// export default Scanner;