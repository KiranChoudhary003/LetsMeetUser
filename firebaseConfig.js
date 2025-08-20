// // firebaseConfig.js
// import { initializeApp } from '@react-native-firebase/app';

// const firebaseConfig = {
//   apiKey: 'AIzaSyBWykA3RFZshY-gubN2DnPCGJBEAq1L6Ns',
//   authDomain: 'letsmeet-b2460.firebaseapp.com',
//   projectId: 'letsmeet-b2460',
//   storageBucket: 'letsmeet-b2460.firebasestorage.app',
//   messagingSenderId: '330043211372',
//   appId: '1:330043211372:web:b27fa6082ca5a0cc98e249',
//   measurementId: 'G-092RQMDK72',
// };

// const app = initializeApp(firebaseConfig);

// export default app;


import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import firebase from '@react-native-firebase/app';

// Optional safety check
if (!firebase.apps.length) {
  firebase.app(); // initializes the default app from GoogleService-Info.plist
}

AppRegistry.registerComponent(appName, () => App);
