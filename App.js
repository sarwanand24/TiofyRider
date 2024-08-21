import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './Screens/SplashScreen';
import Login from './Screens/Authentication/Login';
import Signup from './Screens/Authentication/Signup';
import AuthScreen from './Screens/Authentication/AuthScreen'; // Import the new AuthScreen component
import RiderDashboard from './Screens/RiderDashboard';
import MapDirection from './Screens/MapDirection';
import RiderProfile from './Screens/RiderProfile';
import Foody from './Screens/Foody';
import Loading from './Screens/Loading';

const Stack = createStackNavigator();

const App = () => {
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
        <Stack.Screen name="RiderDashboard" component={RiderDashboard} />
        <Stack.Screen name="MapDirection" component={MapDirection} />
        <Stack.Screen name="RiderProfile" component={RiderProfile} />
        <Stack.Screen name="Foody" component={Foody} />
        <Stack.Screen name="Loading" component={Loading} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;