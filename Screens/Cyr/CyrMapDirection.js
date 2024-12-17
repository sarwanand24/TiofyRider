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

function CyrMapDirection({ route }) { // Destructuring orderId from props

  const { orderId, userInfo } = route.params;
  const navigation = useNavigation();

  const [mapInfo, setMapInfo] = useState({
    User: { lat: 0, long: 0 },
    destination: { lat: 0, long: 0 },
    Rider: { latitude: 0, longitude: 0, heading: 0 }
  });
  const [riderHeads, setRiderHeads] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [liftedPassenger, setLiftedPassenger] = useState(false);
  const [earning, setEarning] = useState(0);
  const [popup, setPopup] = useState(false);
  const [bounceValue] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasDeliveredOrder, setHasDeliveredOrder] = useState(false)
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
        const userId = userInfo?.userId || 'null';
        socket.emit('RiderCurrentLocation', { latitude, longitude, heading, userId });
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
      const response = await fetch(`https://trioserver.onrender.com/api/v1/cyrOrder/order/${orderId}`, {
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
      const userLatLng = orderData.fromLocation || { lat: 0, long: 0 };
      const destination = orderData.toLocation || { lat: 0, long: 0 };
      const riderLatLng = orderData.Rider[0] || { latitude: 0, longitude: 0 };

      setOrderInfo(orderData)
      console.log('check rani boor phata boor jo nikhil phada', 'rani ka boor ka baal', orderData)
      setEarning(data.data?.riderEarning)

      setMapInfo({
        User: {
          lat: userLatLng.lat,
          long: userLatLng.long
        },
        destination: {
          lat: destination.lat,
          long: destination.long
        },
        Rider: {
          latitude: riderLatLng.latitude,
          longitude: riderLatLng.longitude
        }
      });

      if (!liftedPassenger) {
        fetchRoute({
          start: { latitude: riderLatLng.latitude, longitude: riderLatLng.longitude },
          end: { latitude: userLatLng.lat, longitude: userLatLng.long }
        });
      } else {
        fetchRoute({
          start: { latitude: riderLatLng.latitude, longitude: riderLatLng.longitude },
          end: { latitude: destination.lat, longitude: destination.long }
        });
      }

      setOtp(data.data?.otp)

    } catch (error) {
      console.error('Error in fetching map details:', error);
    } finally {
      setLoading(false)
    }
  };

  console.log('mapinfos', mapInfo.User, mapInfo.destination, mapInfo.Rider);


  const fetchRoute = async ({ start, end }) => {
    try {
      console.log('startend........', start, end);
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
        if (!liftedPassenger) {
          fetchRoute({
            start: { latitude: mapInfo.Rider.latitude, longitude: mapInfo.Rider.longitude },
            end: { latitude: mapInfo.User.lat, longitude: mapInfo.User.long }
          });
        } else {
          fetchRoute({
            start: { latitude: mapInfo.Rider.latitude, longitude: mapInfo.Rider.longitude },
            end: { latitude: mapInfo.destination.lat, longitude: mapInfo.destination.long }
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

  const handleLiftedPassenger = async () => {
    if (!liftedPassenger) {
      setLiftedPassenger(true);
      try {
        const check = await fetchRoute({
          start: { latitude: mapInfo.Rider.latitude, longitude: mapInfo.Rider.longitude },
          end: { latitude: mapInfo.destination.lat, longitude: mapInfo.destination.long }
        });
        console.log('checking13', check)
        const response = await fetch(`https://trioserver.onrender.com/api/v1/cyrOrder/order-update/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rideStatus: 'The journey starts, Rider onboarded you.' }),
        });

        if (!response.ok) {
          throw new Error(`Error updating order status: ${response.statusText}`);
        }

        // const result = await response.json();
        // console.log('Ride status for passenger pickup updated successfully:', result);
      } catch (error) {
        console.log('Error in updating OrderStatus for passenger pickup Rani:', error);
      }
    }
  };

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
          console.log('entryy test passed')
          const response = await fetch(`https://trioserver.onrender.com/api/v1/cyrOrder/order/${orderId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
            },
            body: JSON.stringify({ rideStatus: 'Delivered', riderEarning: earning }),
          });
          console.log('entryy test passed2')
          if (!response.ok) {
            throw new Error(`Error updating order status: ${response.statusText}`);
          }

          console.log('Order status updated successfully:', response);
          // Show the popup message with the earning
          showPopup(earning);
          setTimeout(() => {
            navigation.replace('RiderDashboard'); // Replace 'DifferentScreen' with your target screen name
          }, 4000);
        } catch (error) {
          console.error('Failed to update order status:', error);
        }
      }
    } else {
      setErrorMessage('Invalid OTP. Please try again.');
    }
  };

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
        if(liftedPassenger){
          url = `https://www.google.com/maps/dir/?api=1&origin=${mapInfo.Rider.latitude},${mapInfo.Rider.longitude}&destination=${mapInfo.destination.lat},${mapInfo.destination.long}&travelmode=driving`;
        }
        else{
          url = `https://www.google.com/maps/dir/?api=1&origin=${mapInfo.Rider.latitude},${mapInfo.Rider.longitude}&destination=${mapInfo.User.lat},${mapInfo.User.long}&travelmode=driving`;
        }
    
        Linking.openURL(url).catch(err => console.error("An error occurred", err));
      };

  return (
    <View style={styles.container}>
             <StatusBar hidden={true} />
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

        {!liftedPassenger && (
          <Marker
            coordinate={{ latitude: mapInfo.User.lat, longitude: mapInfo.User.long }}
            title={'PickupLocation'}
            description={'Location of the user'}
          >
            <Image source={require('../../assets/person.png')} style={styles.markerImage} />
          </Marker>
        )}

        <Marker
          coordinate={{ latitude: mapInfo.destination.lat, longitude: mapInfo.destination.long }}
          title={'User'}
          description={'Location of the destination'}
        >
          <Image source={require('../../assets/location.webp')} style={styles.markerImage} />
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
          <Text style={styles.infoText}>From: {OrderInfo?.fromLocation.placeName}</Text>
          <Text style={styles.infoText}>To: {OrderInfo?.toLocation.placeName}</Text>
          <TouchableOpacity style={{ margin: 'auto' }} onPress={openMap}>
            <Text style={{ color: 'white' }}>View on map</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.sliderContainer}>
      {liftedPassenger ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#f80c4c' }]}
            onPress={handleOrderDelivered}
          >
            <Text style={styles.buttonText}>Arrived at Destination?</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#f1c40f' }]}
            onPress={handleLiftedPassenger}
          >
            <Text style={styles.buttonText}>Lifted Passenger?</Text>
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
            />
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={verifyOtpAndDeliverOrder}>
              <Text style={{ color: 'white' }}>Submit Otp</Text>
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
    flex: 1
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
    backgroundColor: '#68095f',
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
    borderRadius: 25,
  },
  sliderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    fontFamily: 'CartoonBold',
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
  input: {
    color: 'white',
    textAlign: 'center'
  }
});

export default CyrMapDirection;
