import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
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
import { LocationProvider } from './src/components/LocationContext/LocationContext';
import Scanner from './src/components/Scanner';
import UserListScreen from './src/components/Chatting/UserListScreen';
import ChatPage from './src/components/Chatting/ChatPage';
import UserFriendList from './src/components/Chatting/UserFriendList';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import MeetingsScreen from './src/components/Meetings';


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
            </Stack.Navigator>
          </NavigationContainer>
        </LocationProvider>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
};

export default App;