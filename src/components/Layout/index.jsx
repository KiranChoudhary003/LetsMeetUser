import React from 'react';
import { View, StyleSheet } from 'react-native';
import Header from '../Header';
import BottomTab from '../BottomTab';
import { createStackNavigator } from '@react-navigation/stack';
import Home from '../Home/index.jsx';
import MyEvents from '../MyEvents/index.jsx';
import Complain from '../Complain/index.jsx';

const InnerStack = createStackNavigator();

const Layout = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Header />
      </View>

      <View style={styles.body}>
        <InnerStack.Navigator screenOptions={{ headerShown: false }}>
          <InnerStack.Screen name="Home" component={Home} />
          <InnerStack.Screen name="MyEvents" component={MyEvents} />
          <InnerStack.Screen name="Complain" component={Complain} />
        </InnerStack.Navigator>
      </View>

      <View style={styles.footer}>
        <BottomTab />
      </View>
    </View>
  );
};

export default Layout;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  footer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
