import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@react-native-community/blur';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import ChatPage from './src/components/Chatting/ChatPage';
import UserFriendList from './src/components/Chatting/UserFriendList';
import UserListScreen from './src/components/Chatting/UserListScreen';
import Connection from './src/components/Connections';
import Description from './src/components/Description';
import Edit from './src/components/Edit';
import Layout from './src/components/Layout';
import { LocationProvider } from './src/components/LocationContext/LocationContext';
import Login from './src/components/Login';
import MeetingNoteScreen from './src/components/MeetingNoteScreen';
import MeetingScreen from './src/components/MeetingScreen';
import MyEventsDesciption from './src/components/MyEventsDesciption';
import QRCodeScreen from './src/components/QRCodeScreen';
import Scanner from './src/components/Scanner';
import SignUp from './src/components/SignUp';
import UserEvents from './src/components/UserEvents';
import UserProfile from './src/components/UserProfile';
import Welcome from './src/components/Welcome';
import { connectSocket, getSocket } from './src/socket';

enableScreens();
const Stack = createStackNavigator();

const App = () => {
  const navigationRef = useNavigationContainerRef();
  const socketSetupDone = useRef(false);

  const [meetingModalVisible, setMeetingModalVisible] = useState(false);
  const [meetingData, setMeetingData] = useState(null);
  const [meetingExpired, setMeetingExpired] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const timeoutIdRef = useRef(null);

  useEffect(() => {
    const setupSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.warn("⛔ No token found. Skipping socket setup.");
          return;
        }

        await connectSocket(token);
        const socket = getSocket();

        if (!socket || socketSetupDone.current) return;

        socketSetupDone.current = true;
        console.log("✅ Global socket listener initialized");

        socket.on('meeting_request', ({ fromUserId, fromUserName, eventId }) => {
          console.log("📥 Received meeting_request:", { fromUserId, fromUserName, eventId });

          setMeetingData({ fromUserId, fromUserName, eventId });
          setMeetingExpired(false);
          setMeetingModalVisible(true);
          progressAnim.setValue(0);

          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: false,
          }).start();

          if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = setTimeout(() => {
            setMeetingExpired(true);
          }, 10000);
        });

        socket.on('write_meeting_notes', ({ meetingId }) => {
          console.log("📝 write_meeting_notes received, navigating...");
          navigationRef.current?.navigate('MeetingNoteScreen', { meetingId });
        });

        socket.on('meeting_error', ({ message }) => {
          Alert.alert('Meeting Error', message);
        });

        socket.on('meeting_declined', ({ by }) => {
          Alert.alert('Declined', 'Your meeting request was declined.');
        });

      } catch (err) {
        console.warn("⚠️ Socket setup failed in App.jsx:", err.message);
      }
    };

    console.log("📡 Setting up global socket listeners in App.jsx");
    setupSocket();

    return () => {
      try {
        const socket = getSocket();
        socket.off('meeting_request');
        socket.off('write_meeting_notes');
        socket.off('meeting_error');
        socket.off('meeting_declined');
      } catch (err) { }
    };
  }, []);

  const clearMeetingTimeouts = () => {
    clearTimeout(timeoutIdRef.current);
    progressAnim.setValue(0);
  };

  const handleAccept = () => {
    if (meetingData) {
      const socket = getSocket();
      socket.emit('respond_meeting_request', {
        fromUserId: meetingData.fromUserId,
        eventId: meetingData.eventId,
        accept: true,
      });
    }
    clearMeetingTimeouts();
    setMeetingModalVisible(false);
  };

  const handleDecline = () => {
    if (meetingData) {
      const socket = getSocket();
      socket.emit('respond_meeting_request', {
        fromUserId: meetingData.fromUserId,
        eventId: meetingData.eventId,
        accept: false,
      });
    }
    clearMeetingTimeouts();
    setMeetingModalVisible(false);
  };

  const handleExpiredOk = () => {
    clearMeetingTimeouts();
    setMeetingModalVisible(false);
  };

  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <LocationProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Welcome" component={Welcome} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="SignUp" component={SignUp} />
              <Stack.Screen name="Layout" component={Layout} />
              <Stack.Screen name="Edit" component={Edit} />
              <Stack.Screen name="UserListScreen" component={UserListScreen} />
              <Stack.Screen name="UserFriendList" component={UserFriendList} />
              <Stack.Screen name="ChatPage" component={ChatPage} />
              <Stack.Screen name="Scanner" component={Scanner} />
              <Stack.Screen name="QRCode" component={QRCodeScreen} />
              <Stack.Screen name="Description" component={Description} />
              <Stack.Screen name="Connection" component={Connection} />
              <Stack.Screen name="UserProfile" component={UserProfile} />
              <Stack.Screen name="MyEventsDescription" component={MyEventsDesciption} />
              <Stack.Screen name="UserEvents" component={UserEvents} />
              <Stack.Screen name="MeetingScreen" component={MeetingScreen} />
              <Stack.Screen name="MeetingNoteScreen" component={MeetingNoteScreen} />
            </Stack.Navigator>

            {/* Modal for Meeting Request */}
            <Modal visible={meetingModalVisible} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.modalWrapper}>
                  <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Meeting Request</Text>
                    <Text style={styles.modalMessage}>
                      {meetingExpired
                        ? 'Request expired. You did not respond in time.'
                        : meetingData?.fromUserName
                          ? `${meetingData.fromUserName} has requested a meeting.\nAccept it?`
                          : 'You have a new meeting request. Accept it?'}
                    </Text>

                    {!meetingExpired && (
                      <View style={styles.progressBarContainer}>
                        <Animated.View
                          style={[
                            styles.progressBarFill,
                            {
                              width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                              }),
                            },
                          ]}
                        />
                      </View>
                    )}

                    <View style={styles.modalButtons}>
                      {meetingExpired ? (
                        <TouchableOpacity
                          style={[styles.modalButton, styles.acceptBtn]}
                          onPress={handleExpiredOk}
                        >
                          <Text style={styles.modalButtonText}>OK</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={[styles.modalButton, styles.acceptBtn]}
                            onPress={handleAccept}
                          >
                            <Text style={styles.modalButtonText}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.modalButton, styles.declineBtn]}
                            onPress={handleDecline}
                          >
                            <Text style={styles.modalButtonText}>Decline</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </Modal>
          </NavigationContainer>
        </LocationProvider>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
};

export default App;

// Styles
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },
  modalTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    color: '#555',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34495e',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    width: '40%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#34495e',
  },
  declineBtn: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
