import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../Header';
import BottomTab from '../BottomTab';
import { createStackNavigator } from '@react-navigation/stack';
import Home from '../Home/index.jsx';
import MyEvents from '../MyEvents/index.jsx';
import Complain from '../Complain/index.jsx';
import Meetings from '../Meetings/index.jsx';

const InnerStack = createStackNavigator();

const Layout = () => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Header />
        </View>

        <View style={styles.body}>
          <InnerStack.Navigator screenOptions={{ headerShown: false }}>
            <InnerStack.Screen name="Home" component={Home} />
            <InnerStack.Screen name="MyEvents" component={MyEvents} />
            <InnerStack.Screen name="Complain" component={Complain} />
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
    backgroundColor: '#fff',
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
