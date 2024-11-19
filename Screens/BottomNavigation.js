import React, { useState } from 'react';
import { BottomNavigation, Text } from 'react-native-paper';
import RiderDashboard from './RiderDashboard'; // Assuming this is the component we are working on
import Earnings from './Earnings';
import More from './More';
const Notifications = () => {<Text>Notification</Text>}

const MainApp = (props) => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'earnings', title: 'Earnings', focusedIcon: 'purse-outline', unfocusedIcon: 'purse' },
    { key: 'notifications', title: 'Notifications', focusedIcon: 'bell', unfocusedIcon: 'bell-outline' },
    { key: 'more', title: 'More', focusedIcon: 'account', unfocusedIcon: 'account-circle-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: () => <RiderDashboard {...props} />,
    earnings: () => <Earnings {...props} />,
    notifications: () => <Notifications {...props} />,
    more: () => <More {...props} />,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      barStyle={{ backgroundColor: '#5ecdf9', height: 50 }}
      activeColor='lightpink'
      inactiveColor='white'
    />
  );
};

export default MainApp;
