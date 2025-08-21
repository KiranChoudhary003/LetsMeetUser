import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import {decode as atob, encode as btoa} from 'base-64';
import 'text-encoding';

if (!global.atob) {
  global.atob = atob;
}
if (!global.btoa) {
  global.btoa = btoa;
}

AppRegistry.registerComponent(appName, () => App);
