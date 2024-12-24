import React, { useState, useEffect } from 'react';
import { View, Text, PermissionsAndroid, Platform, Dimensions, StyleSheet, Button, TextInput, Modal, Image, Animated, PanResponder, Alert, TouchableOpacity, Linking, StatusBar } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, Polyline } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socket from '../../utils/Socket';
import { useNavigation } from '@react-navigation/native';
import Loading from '../Loading';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.04;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

function FoodMapDirection({ route }) { // Destructuring orderId from props

  const { orderId, reachedRestro } = route.params;
  const navigation = useNavigation();

  const [mapInfo, setMapInfo] = useState({
    User: { latitude: 0, longitude: 0 },
    Restaurant: { latitude: 0, longitude: 0 },
    Rider: { latitude: 0, longitude: 0, heading: 0 }
  });
  const [riderHeads, setRiderHeads] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isAtRestaurant, setIsAtRestaurant] = useState(reachedRestro);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [hasArrivedAtRestaurant, setHasArrivedAtRestaurant] = useState(reachedRestro);
  const [hasDeliveredOrder, setHasDeliveredOrder] = useState(false);
  const [earning, setEarning] = useState(0);
  const [popup, setPopup] = useState(false);
  const [bounceValue] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [OrderInfo, setOrderInfo] = useState(null);

  React.useEffect(() => {
    if (popup) {
      Animated.spring(bounceValue, {
        toValue: 1,
        friction: 2,
        tension: 160,
        useNativeDriver: true,
      }).start();
    }
  }, [popup]);

  useEffect(() => {
    if (orderId) {
      fetchMapDetails();
    }
  }, [orderId]); // Fetch map details when orderId is received

  const [slideValue, setSlideValue] = useState(new Animated.Value(0));

  const getCurrentLocation = () =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude, heading } = position.coords;
          setRiderHeads(heading);
          resolve({ latitude, longitude, heading });
        },
        error => {
          reject(error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });

  const locationPermission = () => new Promise(async (resolve, reject) => {
    if (Platform.OS === 'ios') {
      try {
        const permissionStatus = await Geolocation.requestAuthorization('whenInUse');
        if (permissionStatus === 'granted') {
          return resolve('granted');
        }
        reject('Permission not granted');
      } catch (error) {
        return reject(error);
      }
    }
    return PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ).then((granted) => {
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        resolve('granted');
      }
      return reject('Location Permission denied');
    }).catch((error) => {
      return reject(error);
    });
  });

  useEffect(() => {
    getLiveLocation();
  }, []);

  const getLiveLocation = async () => {
    const locPermissionDenied = await locationPermission();
    if (locPermissionDenied === 'granted') {
      try {
        const { latitude, longitude, heading } = await getCurrentLocation();
        // const userId = userInfo?.userId || 'null';
        // socket.emit('RiderCurrentLocation', { latitude, longitude, heading, userId });
        setMapInfo(prev => ({
          ...prev,
          Rider: { latitude, longitude, heading }
        }));
      } catch (error) {
        console.log('Error getting location:', error);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      getLiveLocation();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchMapDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`https://trioserver.onrender.com/api/v1/foodyOrder/order/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const orderData = data.data;
      // Extract User, Restaurant, and Rider details
      const userLatLng = orderData.User[0] || { latitude: 0, longitude: 0 };
      const restaurantLatLng = orderData.Restaurant[0] || { latitude: 0, longitude: 0 };
      const riderLatLng = orderData.Rider[0] || mapInfo.Rider;

      setOrderInfo(orderData);

      setEarning(data.data?.riderEarning)

      setMapInfo({
        User: {
          latitude: userLatLng.latitude,
          longitude: userLatLng.longitude
        },
        Restaurant: {
          latitude: restaurantLatLng.latitude,
          longitude: restaurantLatLng.longitude
        },
        Rider: {
          latitude: riderLatLng.latitude,
          longitude: riderLatLng.longitude
        }
      });

      if (!isAtRestaurant) {
        fetchRoute({
          start: { latitude: riderLatLng.latitude, longitude: riderLatLng.longitude },
          end: { latitude: restaurantLatLng.latitude, longitude: restaurantLatLng.longitude }
        });
      } else {
        fetchRoute({
          start: { latitude: riderLatLng.latitude, longitude: riderLatLng.longitude },
          end: { latitude: userLatLng.latitude, longitude: userLatLng.longitude }
        });
      }

      setOtp(data.data?.otp)

    } catch (error) {
      console.error('Error in fetching map details:', error);
    } finally {
      setLoading(false)
    }
  };

  const fetchRoute = async ({ start, end }) => {
    try {
      console.log('startend', start, end);
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full`);
      const data = await response.json();
      const encodedPolyline = data.routes[0].geometry;
      const distance = data.routes[0].distance;
      const duration = data.routes[0].duration;

      if (distance === 0 || duration === 0) {
        console.warn('The start and end locations are the same or too close to calculate a meaningful route.');
        return;
      }

      setRouteDistance(distance);
      setRouteDuration(duration);
      const coordinates = polyline.decode(encodedPolyline).map(point => ({
        latitude: point[0],
        longitude: point[1],
      }));

      setRouteCoordinates(coordinates);
    } catch (error) {
      console.error('Error fetching route:', error.message);
    }
  };

  console.log('mapinfos', mapInfo.User, mapInfo.Restaurant, mapInfo.Rider);
  
  useEffect(() => {
    const updateRiderLocation = async (latitude, longitude) => {
      const token = await AsyncStorage.getItem('token');
      try {
        const response = await fetch('https://trioserver.onrender.com/api/v1/riders/update-rider-location', {
          method: 'POST',
          headers: new Headers({
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ latitude, longitude }),
        });
        if (!response.ok) {
          throw new Error('Error updating location');
        }
        console.log('Location updated successfully');
        if (!isAtRestaurant) {
          fetchRoute({
            start: { latitude: mapInfo.Rider.latitude, longitude: mapInfo.Rider.longitude },
            end: { latitude: mapInfo.Restaurant.latitude, longitude: mapInfo.Restaurant.longitude }
          });
        } else {
          fetchRoute({
            start: { latitude: mapInfo.Rider.latitude, longitude: mapInfo.Rider.longitude },
            end: { latitude: mapInfo.User.latitude, longitude: mapInfo.User.longitude }
          });
        }
      } catch (error) {
        console.error('Failed to update location:', error);
      }
    };

    const riderLatitude = mapInfo.Rider.latitude;
    const riderLongitude = mapInfo.Rider.longitude;

    if (riderLatitude !== 0 && riderLongitude !== 0) {
      updateRiderLocation(riderLatitude, riderLongitude);
    }
  }, [mapInfo.Rider]);

  const handleArrivalAtRestaurant = async () => {
    if (!hasArrivedAtRestaurant) {
      setIsAtRestaurant(true);
      console.log('Arrived Restro---------------');
      setHasArrivedAtRestaurant(true);
      await fetchRoute({
        start: { latitude: mapInfo.Rider.latitude, longitude: mapInfo.Rider.longitude },
        end: { latitude: mapInfo.User.latitude, longitude: mapInfo.User.longitude }
      });
      try {
        const response = await fetch(`https://trioserver.onrender.com/api/v1/foodyOrder/order-update/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderStatus: 'Rider has picked your order from restaurant' }),
        });

        if (!response.ok) {
          throw new Error(`Error updating order status: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Order status for restro pickup updated successfully:', result);
      } catch (error) {
        console.error('Error in updating OrderStatus for restro pickup:', error);
        Alert.alert('Error', 'Unable to update orderStatus of restro pickup.');
      }
    }
  };

  // const calculateEarning = async () => {
  //   console.log('startend', mapInfo.User, mapInfo.Restaurant);
  //   const response1 = await fetch(`https://router.project-osrm.org/route/v1/driving/${mapInfo.Restaurant.longitude},${mapInfo.Restaurant.latitude};${mapInfo.User.longitude},${mapInfo.User.latitude}?overview=full`);
  //   const data = await response1.json();
  //   const distance = data.routes[0].distance;
  //   const duration = data.routes[0].duration;

  //   const distanceInKm = (distance / 1000).toFixed(2);

  //   console.log('distanceeeeee', distanceInKm, distance, distance/1000);


  //   // Send distance to the server to get the calculated earning
  //   const response = await axios.post('https://trioserver.onrender.com/api/v1/riders/calculateEarning', {
  //     distanceInKm,
  //   });

  //   console.log('response', response.data.earning);


  //   const calculatedEarning = response.data.earning;
  //   const nonDecimalEarning = Math.floor(calculatedEarning);

  //   console.log('Earninghhhgvsgdbdx', nonDecimalEarning);

  //   // Update state and return
  //   setEarning(nonDecimalEarning);
  //   return nonDecimalEarning;
  // };

  const showPopup = (riderEarning) => {
    console.log('earningggg', riderEarning);
    setPopup(true);
    // Alert.alert(`Fuckk you earned RS ${riderEarning}`)
  };

  const handleOrderDelivered = async () => {
    setIsModalVisible(true); 
  };

  const verifyOtpAndDeliverOrder = async () => {
    console.log('enteredOtp:', enteredOtp, otp);
    if (enteredOtp == otp) {
      setIsModalVisible(false)
      if (!hasDeliveredOrder) {
        setHasDeliveredOrder(true);
        console.log('Order delivered!');
        console.log('RiderEarning', earning);
        try {
          const response = await fetch(`https://trioserver.onrender.com/api/v1/foodyOrder/order/${orderId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
            },
            body: JSON.stringify({ orderStatus: 'Delivered', riderEarning: earning }),
          });
  
          if (!response.ok) {
            throw new Error(`Error updating order status: ${response.statusText}`);
          }
  
          const result = await response.json();
          console.log('Order status updated successfully:', result);
          // Show the popup message with the earning
          showPopup(earning);
          setTimeout(() => {
            navigation.replace('MainApp'); // Replace 'DifferentScreen' with your target screen name
          }, 4000);
        } catch (error) {
          console.error('Failed to update order status:', error);
        }
      }
    } else {
      setErrorMessage('Invalid OTP. Please try again.');
    }
  };

  const panResponderDelivery = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event(
      [null, { dx: slideValue }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (e, { dx }) => {
      if (dx > width * 0.4) {
        handleOrderDelivered();
        Animated.spring(slideValue, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      } else {
        Animated.spring(slideValue, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  if (loading) {
    return <Loading />
  }

    const handleCall = () => {
      const mobileNo = OrderInfo?.User[0]?.mobileNo;
      if (mobileNo) {
        Linking.openURL(`tel:${mobileNo}`);
      }
    }

    const openMap = () => {
      let url = '';
      if(isAtRestaurant){
        url = `https://www.google.com/maps/dir/?api=1&origin=${mapInfo.Rider.latitude},${mapInfo.Rider.longitude}&destination=${mapInfo.User.latitude},${mapInfo.User.longitude}&travelmode=driving`;
      }
      else{
        url = `https://www.google.com/maps/dir/?api=1&origin=${mapInfo.Rider.latitude},${mapInfo.Rider.longitude}&destination=${mapInfo.Restaurant.latitude},${mapInfo.Restaurant.longitude}&travelmode=driving`;
      }
  
      Linking.openURL(url).catch(err => console.error("An error occurred", err));
    };

  return (
    <View style={styles.container}>
             <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: mapInfo.Rider.latitude,
          longitude: mapInfo.Rider.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
      >
        <Marker
          coordinate={{ latitude: mapInfo.Rider.latitude, longitude: mapInfo.Rider.longitude }}
          title={'Rider'}
          description={'Current location of the rider'}
        >
          <Image source={require('../../assets/bike.png')}
            style={[
              styles.markerImage,
              {
                transform: [{ rotate: `${riderHeads}deg` }]
              }
            ]} />
        </Marker>
        <Marker
          coordinate={{ latitude: mapInfo.Restaurant.latitude, longitude: mapInfo.Restaurant.longitude }}
          title={'Restaurant'}
          description={'Location of the restaurant'}
        >
          <Image source={require('../../assets/restaurant.png')} style={styles.markerImage} />
        </Marker>
        <Marker
          coordinate={{ latitude: mapInfo.User.latitude, longitude: mapInfo.User.longitude }}
          title={'User'}
          description={'Location of the user'}
        >
          <Image source={require('../../assets/person.png')} style={styles.markerImage} />
        </Marker>
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#68095f"
            strokeWidth={3}
          />
        )}
      </MapView>
      
      {routeDistance && routeDuration && (
        <View style={styles.routeInfo}>
          <Text style={styles.infoText}>Distance: {(routeDistance / 1000).toFixed(2)} km</Text>
          <Text style={styles.infoText}>Duration: {(routeDuration / 60).toFixed(0)} mins</Text>
         <Text style={styles.infoText}>
              {OrderInfo?.User[0]?.fullName}:{' '}
              <TouchableOpacity onPress={handleCall}>
                <Text style={styles.callText}>+91 {OrderInfo?.User[0]?.mobileNo}</Text>
              </TouchableOpacity>
            </Text>
            <TouchableOpacity style={{margin: 'auto'}} onPress={openMap}>
              <Text style={{color:'white'}}>View on map</Text>
            </TouchableOpacity>
        </View>
      )}

      <View style={styles.sliderContainer}>
      {isAtRestaurant ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'red' }]} // Yellow
            onPress={handleOrderDelivered}
          >
            <Text style={styles.buttonText}>Delivered Order?</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'green', borderWidth: 1, borderColor: '#ccc' }]} // White with border
            onPress={handleArrivalAtRestaurant}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>Arrived at Restaurant?</Text>
          </TouchableOpacity>
        )}
      </View>
      <Modal
        transparent={true}
        animationType="fade"
        visible={popup}
      >
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: bounceValue }],
              },
            ]}
          >
            <Text style={styles.modalTitle}>🎉 Awesome Job! 🎉</Text>
            <Text style={styles.modalText}>You’ve just earned:</Text>
            <Text style={styles.modalEarning}>Rs {earning}</Text>
          </Animated.View>
        </View>
      </Modal>
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              value={enteredOtp}
              onChangeText={(text) => setEnteredOtp(text)}
              keyboardType="numeric"
              maxLength={4}
              placeholder="Enter 4-digit OTP"
              placeholderTextColor={'white'}
            />
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={verifyOtpAndDeliverOrder}>
              <Text style={{color:'white'}}>Submit Otp</Text>
              </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex:1
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerImage: {
    width: 40,
    height: 40,
  },
  routeInfo: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#68095F',
    padding: 10,
    zIndex: 1,
    width: '100%'
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'CartoonBold',
  },
  callText: {
    fontSize: 16,
    color: '#ffff00', // Make it look clickable
    textDecorationLine: 'underline', // Add underline for better UX
  },
  sliderContainer: {
    position: 'absolute',
    bottom: 0,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  slider: {
    width: 100,
    height: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'black'
  },
  sliderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    fontFamily: 'CartoonBold',
    textAlign: 'center'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: '#68095F',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffff00',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  modalEarning: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#9f0d91',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  errorText: {
    color: '#ffff00',
    marginBottom: 10,
  },
  input:{
    color:'white',
    textAlign: 'center'
  }
});

export default FoodMapDirection;
