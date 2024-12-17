import {AppRegistry} from 'react-native';
import App from './App';
import messaging from '@react-native-firebase/messaging';
import {name as appName} from './app.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Background notification handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  await storeNotification(remoteMessage);
});

// Function to store notification if it matches criteria
const storeNotification = async remoteMessage => {
  const { title, body } = remoteMessage.notification;

  // Filter notifications with title containing "Alert"
  if (title?.includes("Alert")) {
    const storedNotifications = JSON.parse(await AsyncStorage.getItem('notifications')) || [];
    const updatedNotifications = [...storedNotifications, { title, body, receivedAt: new Date().toISOString(), seen: false }];

    await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  }
};

AppRegistry.registerComponent(appName, () => App);