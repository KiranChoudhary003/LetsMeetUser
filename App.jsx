import { NavigationContainer } from '@react-navigation/native'
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { enableScreens } from 'react-native-screens'
import Welcome from './src/components/Welcome/index.jsx'
import Login from './src/components/Login/index.jsx'
import SignUp from './src/components/SignUp/index.jsx'
import Profile from './src/components/Profile/index.jsx'
import QRCodeScreen from './src/components/QRCodeScreen/index.jsx'
import Scanner from './src/components/Scanner/index.jsx'
import Home from './src/components/Home/index.jsx'
import Edit from './src/components/Edit/index.jsx'
import Description from './src/components/Description/index.jsx'
import MyEvents from './src/components/MyEvents/index.jsx'
import EventAttend from './src/components/EventAttend/index.jsx'
import Connection from './src/components/Connection/index.jsx'
import CheckedInDescription from './src/components/CheckedInDescription/index.jsx'
import UserProfile from './src/components/UserProfile/index.jsx'
import { LocationProvider } from './src/components/LocationContext/LocationContext.js'

const Stack = createStackNavigator()
enableScreens()

const App = () => {
  return (
    // 🔁 Wrap with provider
    <LocationProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={Welcome} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="UserProfile" component={UserProfile} />
          <Stack.Screen name="QRCode" component={QRCodeScreen} />
          <Stack.Screen name="Scanner" component={Scanner} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Edit" component={Edit} />
          <Stack.Screen name="Description" component={Description} />
          <Stack.Screen name="MyEvents" component={MyEvents} />
          <Stack.Screen name="EventAttend" component={EventAttend} />
          <Stack.Screen name="Connection" component={Connection} />
          <Stack.Screen name="CheckInDescription" component={CheckedInDescription} />
        </Stack.Navigator>
      </NavigationContainer>
    </LocationProvider>
  )
}

export default App
