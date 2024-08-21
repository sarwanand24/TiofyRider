import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PermissionsAndroid, Platform, Alert, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerLayoutAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loading from './Loading';
import { getAccessToken } from '../utils/auth';
import axios from 'axios';
import socket from '../utils/Socket';

// Main Dashboard Component
export default function RiderDashboard(props) {
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [orders, setOrders] = useState([]);
  const [userInfo, setUserInfo] = useState([]);
  const [orderId, setOrderId] = useState('');
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState(false);
  const [undeliveredOrders, setUndeliveredOrders] = useState([]);

  const drawer = React.useRef(null);

  useEffect(() => {
    const fetchUndeliveredOrders = async () => {
      try {
        const jwtToken = getAccessToken();
        const response = await axios.get(`https://trioserver.onrender.com/api/v1/foodyOrder/getUndeliveredOrders`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });

        setUndeliveredOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchUndeliveredOrders();
  }, []);


  // Sidebar content
  const navigationView = () => (
    <View style={styles.drawerContent}>
      <TouchableOpacity style={styles.drawerItem} onPress={() => { props.navigation.push('RiderProfile') }}>
        <Icon name="account" size={30} color="#ff00ff" style={styles.glow} />
        <Text style={[styles.drawerItemText, styles.glow]}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.drawerItem}>
        <Icon name="history" size={30} color="#00ffff" style={styles.glow} />
        <Text style={[styles.drawerItemText, styles.glow]}>Order History</Text>
      </TouchableOpacity>
    </View>
  );

  const getLocation = () => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
        .then(result => {
          if (result === PermissionsAndroid.RESULTS.GRANTED) {
            Geolocation.getCurrentPosition(
              position => {
                setLocation({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                });
                sendLocationToApi(position.coords.latitude, position.coords.longitude);
              },
              error => {
                console.log('Error getting location:', error);
                Alert.alert('Error', 'Unable to retrieve location.');
              }
            );
          } else {
            Alert.alert('Permission Denied', 'Location permission is required.');
          }
        });
    } else {
      // For iOS, handle permissions as needed
      Geolocation.getCurrentPosition(
        position => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          sendLocationToApi(position.coords.latitude, position.coords.longitude);
        },
        error => {
          console.log('Error getting location:', error);
          Alert.alert('Error', 'Unable to retrieve location.');
        }
      );
    }
  };

  const sendLocationToApi = async (latitude, longitude) => {
    try {
      const jwtToken = await getAccessToken();
      const response = await fetch('https://trioserver.onrender.com/api/v1/riders/update-rider-location', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + jwtToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      const text = await response.text(); // Handle plain text response

      if (response.ok) {
        console.log('Location updated:', text);
      } else {
        console.error('Error updating location:', text);
        Alert.alert('Error', 'Unable to update location: ' + text);
      }
    } catch (error) {
      console.error('Error in sendLocationToApi:', error);
      Alert.alert('Error', 'Unable to update location.');
    }
  };

  const saveTokenToDatabase = async (token) => {
    try {
      const jwtToken = await getAccessToken();
      const response = await fetch('https://trioserver.onrender.com/api/v1/riders/set-device-token', {
        method: 'POST',
        headers: new Headers({
          Authorization: 'Bearer ' + jwtToken,
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          token: token
        })
      });
      const data = await response.json();
      console.log('dvc', data);
      if (data.data.deviceToken) {
        await AsyncStorage.setItem('deviceToken', data.data.deviceToken);
      } else {
        alert(data);
      }
    } catch (error) {
      console.log('Error in Storing Device Token', error);
      alert('Error storing device token.');
    }
  };

  const fetchOrders = async () => {
    try {
      const jwtToken = await getAccessToken();
      const response = await fetch('https://trioserver.onrender.com/api/v1/riders/fetchAccept-Reject', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + jwtToken,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok) {
        console.log('order info', data.data);
        const processedData = data.data?.map(order => ({
          ...order,
          foodItems: Array.isArray(order.foodItems) ? order.foodItems : [],
        }));
        console.log('Processed Orders:', processedData);
        setOrders(processedData || []);
        const orderInfos = processedData.map(order => ({
          address: order.userAddress,
          userId: order.userId,
          restaurantId: order.restaurantId,
          foodItems: order.foodItems,
          totalItems: order.totalItems,
          bill: order.bill,
          restroEarning: order.restroEarning,
          city: order.city,
        }));
        // Assuming you have a state to store this information
        setUserInfo(orderInfos);
      } else {
        console.error('Error fetching orders:', data);
        Alert.alert('Error', 'Unable to fetch orders.');
      }
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      Alert.alert('Error', 'Unable to fetch orders.');
    }
  };

  useEffect(() => {
    getLocation();
    messaging()
      .getToken()
      .then(token => {
        saveTokenToDatabase(token);
      });

    return messaging().onTokenRefresh(token => {
      saveTokenToDatabase(token);
    });
  }, []);

  useEffect(() => {
    fetchOrders(); // Fetch orders initially
    const interval = setInterval(fetchOrders, 10000); // Fetch orders every 10 seconds

    return () => clearInterval(interval); // Clear interval on component unmount
  }, [refresh]);

  const orderAccepted = async (order) => {
    // Handle rider acceptance logic here
    console.log(`Rider accepted order with ID: ${order._id}`);
    
    if (!order) {
      console.error('Invalid order');
      return;
    }
  
    // Assuming you need rider data from AsyncStorage
    const riderData = await AsyncStorage.getItem('Riderdata');
    const rider = JSON.parse(riderData); // Ensure you parse the JSON data
    const riderName = rider?.riderName;
    console.log('Name', riderName);
    
    // Emit the order data through the socket
    socket.emit('RiderAcceptedOrder', {
      riderId: order._id,
      userAddress: order.userAddress,
      userId: order.userId,
      restaurantId: order.restaurantId,
      foodItems: order.foodItems,
      totalItems: order.totalItems,
      bill: order.bill,
      city: order.city,
      restroEarning: order.restroEarning,
      riderName
    });
  
    console.log('Emitted RiderAcceptedOrder:', order);
    setLoading(true);
    setRefresh(true); // Trigger refresh or update state as needed
  };

  const orderRejected = async (order) => {
    // Handle rider rejection logic here
    console.log(`Order rejected: ${order._id}`);
    
    if (!order) {
      console.error('Invalid order');
      return;
    }
  
    // Assuming you need rider data from AsyncStorage
    const riderData = await AsyncStorage.getItem('Riderdata');
    const rider = JSON.parse(riderData); // Ensure you parse the JSON data
    const riderName = rider?.riderName;
  
    // Emit the order data through the socket
    socket.emit('RiderRejectedOrder', {
      riderId: order._id,
      userAddress: order.userAddress,
      userId: order.userId,
      restaurantId: order.restaurantId,
      foodItems: order.foodItems,
      totalItems: order.totalItems,
      bill: order.bill,
      city: order.city,
      restroEarning: order.restroEarning,
      riderName
    });
  
    console.log('Emitted RiderRejectedOrder:', order);
    setRefresh(true); // Trigger refresh or update state as needed
  };
  

  socket.on('RiderOrderInform', async (data) => {
    //do if data.riderId equals this rider._id then only execute next lines
    const riderData = await AsyncStorage.getItem('Riderdata');
    const rider = JSON.parse(riderData); 
    console.log('test', data.riderId, rider._id);
    if(data.riderId == rider._id){
      console.log('checked cleared');
      setUserInfo({
        address: data.data.userAddress,
        userId: data.data.userId,
        restaurantId: data.restaurantId,
        foodItems: data.foodItems,
        totalItems: data.totalItems,
        bill: data.bill,
        restroEarning: data.restroEarning,
        city: data.city
      });
    }
  });

  console.log('UserINfo', userInfo);
  
  socket.on('OrderAcceptedbyRider', async (data) => {
    setLoading(false);
    setOrderId(data.orderId);
    console.log('Go to Map--------------------');
    setMap(true)
  });

  if(loading){
    return <Loading />
  }

  if(map){
    props.navigation.push("MapDirection", {orderId: orderId, userInfo, reachedRestro: false})
  }

  return (
    <DrawerLayoutAndroid
      ref={drawer}
      drawerWidth={300}
      drawerPosition="left"
      renderNavigationView={navigationView}
      drawerBackgroundColor="#1b1b1b"
    >
      <ScrollView style={styles.container}>
        {/* Header with Hamburger menu and Title */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.hamburger} onPress={() => drawer.current.openDrawer()}>
            <Icon name="menu" size={30} color="#ffffff" style={styles.glow} />
          </TouchableOpacity>
          <Text style={[styles.title, styles.glow]}>Rider Dashboard</Text>
        </View>

        {/* Subheading for Orders */}
        <Text style={[styles.subheading, styles.glow]}>Your Orders</Text>

        {/* Display fetched orders */}
        <View style={styles.ordersContainer}>
          {orders.length > 0 ? (
            orders.map((order, index) => (
              <View key={index} style={styles.orderBox}>
                {order.orderOf === 'Foody' && (
                  <>
                    <Text style={styles.orderText}>Restaurant: {order.restaurantName}</Text>
                    <Text style={styles.orderText}>Total Items: {order.totalItems}</Text>
                    {order.foodItems.map((food, index) => (
                      <View key={index}>
                        <Text style={styles.orderText}>{food.name} : {food.quantity}</Text>
                      </View>
                    ))}
                    <Text style={styles.orderText}>Bill: Rs {order.bill}</Text>
                  </>
                )}
                {order.orderOf === 'Cab' && (
                  <>
                    <Text style={styles.orderText}>From: {order.fromLocation}</Text>
                    <Text style={styles.orderText}>To: {order.toLocation}</Text>
                    <Text style={styles.orderText}>Distance: {order.distance} km</Text>
                    <Text style={styles.orderText}>Bill: ${order.bill}</Text>
                  </>
                )}
                {order.orderOf === 'Hotel' && (
                  <>
                    <Text style={styles.orderText}>Hotel Name: {order.hotelName}</Text>
                    <Text style={styles.orderText}>Address: {order.hotelAddress}</Text>
                    <Text style={styles.orderText}>Room Type: {order.roomType}</Text>
                    <Text style={styles.orderText}>Bill: ${order.bill}</Text>
                  </>
                )}
                {/* Add more conditional renderings as needed */}
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={() => orderAccepted(order)}
                  >
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => orderRejected(order)}
                  >
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noOrdersText}>No orders yet</Text>
          )}
        </View>

        {/* Main Dashboard Content */}
        <Text style={[styles.subheading, styles.glow]}>All Services</Text>
        <View style={styles.dashboardContainer}>
          <TouchableOpacity style={styles.iconContainer} onPress={()=>{props.navigation.push("Foody")}}>
            <Icon name="food" size={50} color="#ff00ff" style={styles.glow} />
            <Text style={[styles.iconText, styles.glow]}>Foody</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconContainer}>
            <Icon name="car" size={50} color="#00ffff" style={styles.glow} />
            <Text style={[styles.iconText, styles.glow]}>Cab Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconContainer}>
            <Icon name="home" size={50} color="#ffff00" style={styles.glow} />
            <Text style={[styles.iconText, styles.glow]}>Hotel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconContainer}>
            <Icon name="washing-machine" size={50} color="#ff9900" style={styles.glow} />
            <Text style={[styles.iconText, styles.glow]}>Laundry</Text>
          </TouchableOpacity>
        </View>

        {undeliveredOrders.map((order) => (
        <TouchableOpacity
          key={order._id}
          style={styles.orderBox}
          onPress={() =>
            props.navigation.push('MapDirection', {
              orderId: order._id,
              userId: order.orderedBy,
              reachedRestro: false
            })
          }
        >
            <Text style={styles.orderText}>Pending Order from Foody</Text>
          <Text style={styles.orderText}>Order ID: {order._id}</Text>
          <Text style={styles.orderText}>Ordered From: {order.orderedFromLocation}</Text>
          <Text style={styles.orderText}>Bill: {order.bill}</Text>
        </TouchableOpacity>
      ))}
      </ScrollView>
    </DrawerLayoutAndroid>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the title
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff',
  },
  hamburger: {
    position: 'absolute', // Keep the hamburger icon on the left
    left: 15,
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#1b1b1b',
    paddingTop: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#000000', // Dark background
    borderRadius: 15, // Rounded corners
    marginVertical: 10, // Space between items
    borderWidth: 2,
    borderColor: '#ff00ff', // Neon pink border
  },
  drawerItemText: {
    fontSize: 18,
    color: '#ffffff',
    marginLeft: 10,
  },
  ordersContainer: {
    padding: 15,
    backgroundColor: '#1b1b1b',
  },
  orderBox: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 5,
  },
  orderText: {
    color: '#ffffff',
    fontSize: 16,
  },
  noOrdersText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 20,
    color: '#ffffff',
    padding: 10,
    textAlign: 'left',
    paddingLeft: 15
  },
  dashboardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 15,
  },
  iconContainer: {
    alignItems: 'center',
    margin: 10,
  },
  iconText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 5,
  },
  glow: {
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#4caf50', // Green color for accept
  },
  rejectButton: {
    backgroundColor: '#f44336', // Red color for reject
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
