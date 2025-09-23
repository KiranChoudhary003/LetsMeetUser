import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTab from '../BottomTab';
import Header from '../Header';
import Home from '../Home/index.jsx';
import Meetings from '../Meetings/index.jsx';
import MyEvents from '../MyEvents/index.jsx';
import SupportDesk from '../SupportDesk/index.jsx';

const InnerStack = createStackNavigator();

const Layout = () => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Header />
        </View>

        <View style={styles.body}>
          <InnerStack.Navigator screenOptions={{ headerShown: false }}>
            <InnerStack.Screen name="Home" component={Home} />
            <InnerStack.Screen name="MyEvents" component={MyEvents} />
            <InnerStack.Screen name="SupportDesk" component={SupportDesk} />
            <InnerStack.Screen name="Meetings" component={Meetings} />
          </InnerStack.Navigator>
        </View>

        <View style={styles.footer}>
          <BottomTab />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Layout;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#34495e',
  },
  container: {
    flex: 1,
  },
  header: {
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  footer: {
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
