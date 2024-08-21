import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          // Token exists, navigate to RiderDashboard
          navigation.replace('RiderDashboard');
        } else {
          // No token, navigate to Auth screen
          navigation.replace('Auth');
        }
      } catch (error) {
        console.error('Failed to retrieve token:', error);
        // Navigate to Auth screen in case of error
        navigation.replace('Auth');
      }
    };

    checkToken();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.jpeg')} style={styles.logo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Change to your preferred vibrant color
  },
  logo: {
    width: width, // Adjust the width as needed
    height: height, // Adjust the height as needed
  },
});

export default SplashScreen;
