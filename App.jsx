import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import Welcome from './src/components/Welcome';
import Login from './src/components/Login';
import SignUp from './src/components/SignUp';
import Edit from './src/components/Edit';
import QRCodeScreen from './src/components/QRCodeScreen';
import Description from './src/components/Description';
import Connection from './src/components/Connections';
import UserProfile from './src/components/UserProfile';
import MyEventsDesciption from './src/components/MyEventsDesciption';
import Layout from './src/components/Layout';
import Scanner from './src/components/Scanner';
import UserListScreen from './src/components/Chatting/UserListScreen';
import ChatPage from './src/components/Chatting/ChatPage';
import UserFriendList from './src/components/Chatting/UserFriendList';
import UserEvents from './src/components/UserEvents';
import MeetingScreen from './src/components/MeetingScreen';
import MeetingNoteScreen from './src/components/MeetingNoteScreen';

import { LocationProvider } from './src/components/LocationContext/LocationContext';
import UserMeetings from './src/components/UserMeetings';
import MeetingRecords from './src/components/MeetingRecords';

enableScreens();
const Stack = createStackNavigator();

const App = () => {
  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <LocationProvider>
          <NavigationContainer>
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
              <Stack.Screen name="UserMeetings" component={UserMeetings} />
              <Stack.Screen name="MeetingRecord" component={MeetingRecords} />
            </Stack.Navigator>
          </NavigationContainer>
        </LocationProvider>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
};

export default App;


// import React, { useEffect, useState } from 'react';
// import { Alert, StatusBar } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { enableScreens } from 'react-native-screens';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { KeyboardProvider } from 'react-native-keyboard-controller';

// import Welcome from './src/components/Welcome';
// import Login from './src/components/Login';
// import SignUp from './src/components/SignUp';
// import Edit from './src/components/Edit';
// import QRCodeScreen from './src/components/QRCodeScreen';
// import Description from './src/components/Description';
// import Connection from './src/components/Connections';
// import UserProfile from './src/components/UserProfile';
// import MyEventsDesciption from './src/components/MyEventsDesciption';
// import Layout from './src/components/Layout';
// import Scanner from './src/components/Scanner';
// import UserListScreen from './src/components/Chatting/UserListScreen';
// import ChatPage from './src/components/Chatting/ChatPage';
// import UserFriendList from './src/components/Chatting/UserFriendList';
// import UserEvents from './src/components/UserEvents';
// import MeetingScreen from './src/components/MeetingScreen';
// import MeetingNoteScreen from './src/components/MeetingNoteScreen';

// import { LocationProvider } from './src/components/LocationContext/LocationContext';

// import { getSocket } from './src/socket';

// enableScreens();
// const Stack = createStackNavigator();

// const App = () => {

//   useEffect(() => {
//     const socket = getSocket();

//     if (!socket) return;

//     // ✅ Setup listener only if socket is connected
//     socket.on('connect', () => {
//       console.log('✅ Socket connected in App.jsx');

//     });

//     socket.on('meeting_request', ({ fromUserId, eventId }) => {
//       Alert.alert(
//         '🤝 Meeting Request',
//         `User ${fromUserId} wants to meet with you.`,
//         [
//           {
//             text: 'Accept',
//             onPress: () => {
//               socket.emit('meeting_accepted', { fromUserId, eventId });
//               console.log('✅ Meeting accepted');
//             },
//           },
//           {
//             text: 'Decline',
//             style: 'cancel',
//             onPress: () => {
//               socket.emit('meeting_declined', { by: socket.id });
//               console.log('❌ Meeting declined');
//             },
//           },
//         ]
//       );
//     });

//     // ✅ Cleanup on unmount
//     return () => {
//       socket.off('meeting_request');
//       socket.off('connect');
//     };
//   }, []);

//   return (
//     <KeyboardProvider>
//       <SafeAreaProvider>
//         <LocationProvider>
//           <NavigationContainer>
//             <StatusBar barStyle="dark-content" backgroundColor="#fff" />
//             <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
//               <Stack.Screen name="Welcome" component={Welcome} />
//               <Stack.Screen name="Login" component={Login} />
//               <Stack.Screen name="SignUp" component={SignUp} />
//               <Stack.Screen name="Layout" component={Layout} />
//               <Stack.Screen name="Edit" component={Edit} />
//               <Stack.Screen name="UserListScreen" component={UserListScreen} />
//               <Stack.Screen name="UserFriendList" component={UserFriendList} />
//               <Stack.Screen name="ChatPage" component={ChatPage} />
//               <Stack.Screen name="Scanner" component={Scanner} />
//               <Stack.Screen name="QRCode" component={QRCodeScreen} />
//               <Stack.Screen name="Description" component={Description} />
//               <Stack.Screen name="Connection" component={Connection} />
//               <Stack.Screen name="UserProfile" component={UserProfile} />
//               <Stack.Screen name="MyEventsDescription" component={MyEventsDesciption} />
//               <Stack.Screen name="UserEvents" component={UserEvents} />
//               <Stack.Screen name="MeetingScreen" component={MeetingScreen} />
//               <Stack.Screen name="MeetingNoteScreen" component={MeetingNoteScreen} />
//             </Stack.Navigator>
//           </NavigationContainer>
//         </LocationProvider>
//       </SafeAreaProvider>
//     </KeyboardProvider>
//   );
// };

// export default App;
