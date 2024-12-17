import React, { useState, useEffect } from 'react';
import { BottomNavigation, Text } from 'react-native-paper';
import RiderDashboard from './RiderDashboard'; // Assuming this is the component we are working on
import Earnings from './Earnings';
import More from './More';
import Notifications from './Notifications';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';

async function createChannel() {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
}

const MainApp = (props) => {
  const [index, setIndex] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0); 

  useEffect(() => {
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
      updateBadgeCount();
    }
  };

    // Update badge count dynamically
    const updateBadgeCount = async () => {
      const notifications = JSON.parse(await AsyncStorage.getItem('notifications')) || [];
      const unseenNotifications = notifications.filter(n => !n.seen);
      console.log('Unseeen/.........', unseenNotifications.length)
      setBadgeCount(unseenNotifications.length > 0 ? unseenNotifications.length : null);
    };
  
    // Fetch initial badge count
    useEffect(() => {
      updateBadgeCount();
      console.log('BAgeCount', badgeCount)
    }, []);
  
    const markNotificationsAsSeen = async () => {
      console.log('markseen executingg..................')
      console.log('BAgeCountRani', badgeCount)
      const notifications = JSON.parse(await AsyncStorage.getItem('notifications')) || [];
      const updatedNotifications = notifications.map(n => ({ ...n, seen: true }));
  
      // Save updated notifications back to AsyncStorage
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  
      // Reset badge count
      setBadgeCount(0);
    };

  const [routes] = useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'earnings', title: 'Earnings', focusedIcon: 'purse-outline', unfocusedIcon: 'purse' },
    { key: 'notifications', title: 'Notifications', focusedIcon: 'bell', unfocusedIcon: 'bell-outline', badge: badgeCount || null },
    { key: 'more', title: 'More', focusedIcon: 'account', unfocusedIcon: 'account-circle-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: () => <RiderDashboard {...props} />,
    earnings: () => <Earnings  {...props} />,
    notifications: () => (
      <Notifications 
        onMarkSeen={markNotificationsAsSeen} 
        onUpdateBadge={updateBadgeCount} 
      />
    ),
    more: () => <More  {...props} />,
  });

   // Update routes dynamically to add badge to notifications
   const dynamicRoutes = routes.map((route) =>
    route.key === 'notifications'
      ? { ...route, badge: badgeCount > 0 ? badgeCount : false }
      : route
  );

  return (
    <BottomNavigation
      navigationState={{ index, routes: dynamicRoutes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      barStyle={{ backgroundColor: '#9f0d91', height: 50 }}
      activeColor='#68095F'
      inactiveColor='white'
      key={badgeCount}
    />
  );
};

export default MainApp;
