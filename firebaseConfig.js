import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getApp, getApps, initializeApp } from '@react-native-firebase/app';

// Only initialize if no apps exist
if (!getApps().length) {
  initializeApp();
} else {
  getApp();
}

AppRegistry.registerComponent(appName, () => App);
