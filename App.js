import 'react-native-gesture-handler';
import React, {useEffect} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './Screens/SplashScreen';
import Login from './Screens/Authentication/Login';
import Signup from './Screens/Authentication/Signup';
import MainApp from './Screens/BottomNavigation';
import AuthScreen from './Screens/Authentication/AuthScreen';
import FoodMapDirection from './Screens/Food/FoodMapDirection';
import RiderProfile from './Screens/RiderProfile';
import Food from './Screens/Food/Food';
import Loading from './Screens/Loading';
import PeakZonesScreen from './Screens/PeakZonesScreen';
import CyrMapDirection from './Screens/Cyr/CyrMapDirection';
import HelpSupportScreen from './Screens/HelpSupportScreen';
import RiderDashboard from './Screens/RiderDashboard';

import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';

const Stack = createStackNavigator();

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
}

async function createChannel() {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
}

const App = () => {

  useEffect(() => {
    requestUserPermission();
    createChannel();

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('A new foreground notification:', remoteMessage);
      await storeNotification(remoteMessage);
      await notifee.displayNotification({
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
        android: {
          channelId: 'default',
          importance: AndroidImportance.HIGH,
        },
      });
    });

    return unsubscribe;
  }, []);

  const storeNotification = async remoteMessage => {
    const { title, body } = remoteMessage.notification;

    // Filter notifications with title containing "Alert"
    if (title?.includes("Alert")) {
      const storedNotifications = JSON.parse(await AsyncStorage.getItem('notifications')) || [];
      const updatedNotifications = [...storedNotifications, { title, body, receivedAt: new Date().toISOString(), seen: false }];

      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} /> 
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="MainApp" component={MainApp} />
        <Stack.Screen name="PeakZonesScreen" component={PeakZonesScreen} />
        <Stack.Screen name="FoodMapDirection" component={FoodMapDirection} />
        <Stack.Screen name="CyrMapDirection" component={CyrMapDirection} />
        <Stack.Screen name="RiderProfile" component={RiderProfile} />
        <Stack.Screen name="RiderDashboard" component={RiderDashboard} />
        <Stack.Screen name="Food" component={Food} />
        <Stack.Screen name="Loading" component={Loading} />
        <Stack.Screen name="HelpSupportScreen" component={HelpSupportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
