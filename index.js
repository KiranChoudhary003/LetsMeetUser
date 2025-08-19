import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.log('index.js loaded'); // Metro should log this

AppRegistry.registerComponent(appName, () => App);
