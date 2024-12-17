import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ToastAndroid, PermissionsAndroid, Platform, Alert,
  ScrollView, Image, StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { DrawerLayoutAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loading from './Loading';
import { getAccessToken } from '../utils/auth';
import axios from 'axios';
import socket from '../utils/Socket';
import { Switch } from 'react-native-paper';
import LottieView from 'lottie-react-native';

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
  const [undeliveredCyrOrders, setUndeliveredCyrOrders] = useState([]);
  const [orderOf, setOrderOf] = useState('');
  const [online, setOnline] = useState(null);
  const [toggle, setToggle] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [Riderdata, setRiderdata] = useState({});
  const [earningOf, setEarningOf] = useState('Today');
  const [earningData, setEarningData] = useState(null);
  // after accepting each order make rider unavailable and make it available after completing that order
  
  useEffect(() => {
    const fetchRiderData = async () => {
      setLoading(true)
      try {
        // Retrieve the token from AsyncStorage
        const token = await getAccessToken();

        if (token) {
          // Make the API call with the token
          const response = await axios.get('https://trioserver.onrender.com/api/v1/riders/current-rider', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          // Update the state with the fetched data

          setRiderdata(response.data.data);
          setOnline(response.data.data?.availableStatus);
          await AsyncStorage.setItem("Riderdata", JSON.stringify(response.data.data));
        } else {
          console.log("No token found.");
        }
      } catch (error) {
        console.log("Error fetching rider data:", error);
      }finally{setLoading(false)}
    };

    fetchRiderData();
  }, []);

  useEffect(() => {
    const updateGreeting = async () => {
      let rider = await AsyncStorage.getItem('Riderdata')
      console.log('Rider..', rider)
      const riderdata = JSON.parse(rider);
      setRiderdata(riderdata);
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting('Good Morning');
      } else if (hour < 18) {
        setGreeting('Good Afternoon');
      } else if (hour < 21) {
        setGreeting('Good Evening');
      } else {
        setGreeting('Good Night');
      }
    };

    updateGreeting();

    // Optionally, update greeting every hour
    const intervalId = setInterval(updateGreeting, 3600000); // 1 hour

    return () => clearInterval(intervalId); // cleanup on unmount
  }, []);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (Riderdata._id) {
        try {
          const response = await axios.get(
            "https://trioserver.onrender.com/api/v1/riders/get-earnings",
            {
              params: { riderId: Riderdata?._id },
            }
          );
          setEarningData(response.data);
          console.log('earnings data.........', response.data)
        } catch (error) {
          console.error("Error fetching earnings:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEarnings();
  }, [Riderdata?._id]);

  useEffect(() => {
    const fetchUndeliveredOrders = async () => {
      try {
        const jwtToken = await getAccessToken();
        const response = await axios.get(`https://trioserver.onrender.com/api/v1/foodyOrder/getRiderUndeliveredOrders`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });

        setUndeliveredOrders(response.data);
      } catch (error) {
        console.log('Error fetching orders Nikhil:', error);
      }
    };

    fetchUndeliveredOrders();
  }, []);

  useEffect(() => {
    const fetchUndeliveredCyrOrders = async () => {
      try {
        const jwtToken = await getAccessToken();
        const response = await axios.get(`https://trioserver.onrender.com/api/v1/cyrOrder/getRiderUndeliveredOrders`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });

        setUndeliveredCyrOrders(response.data);
      } catch (error) {
        console.log('Error fetching orders Rani:', error);
      }
    };

    fetchUndeliveredCyrOrders();
  }, []);

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

  useEffect(() => {
    const toggleStatus = async () => {
      try {
        if (online !== null) {
          setLoading(true)
          const token = await getAccessToken();
          const response = await axios.post(
            'https://trioserver.onrender.com/api/v1/riders/toggle-availability',
            { availableStatus: online },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.status === 200) {
            setLoading(false)
            ToastAndroid.showWithGravity(
              `You are now ${online ? 'Online, and will receive orders soon.' : 'Offline, and will not receive any orders.'}`,
              ToastAndroid.SHORT,
              ToastAndroid.CENTER
            );
          }
        }
      } catch (error) {
        console.error('Error toggling availableStatus:', error);
        setOnline(!online)
        ToastAndroid.showWithGravity(
          "Failed to update Online Status.",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER
        );
      }finally{
        setLoading(false)
      }
    }
    toggleStatus();
  }, [toggle])

  const onToggleSwitch = () => {
    setOnline(!online);
    setToggle(!toggle);
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
        console.log('order info', data.data); // from here check whether order belongs to food, cyr or any other
        const processedData = data.data?.map(order => {
          // Check if orderOf is "Foody" or "Cyr"
          if (order.orderOf === 'Foody') {
            // Process "Foody" orders as needed
            return {
              ...order,
              foodItems: Array.isArray(order.foodItems) ? order.foodItems : [],
            };
          } else if (order.orderOf === 'Cyr') {
            // For "Cyr" orders, return the order as it is
            return order;
          }
          return null; // or handle any other cases if needed
        }).filter(order => order !== null); // Filter out any null values
        console.log('Processed Orders:', processedData);
        setOrders(processedData || []);
      } else {
        console.log('Error fetching orders:', data);
        Alert.alert('Error', 'Unable to fetch orders.');
      }
    } catch (error) {
      console.log('Error in fetchOrders:', error);
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
    setUserInfo({ userId: order.userId })
    // Emit the order data through the socket
    if (order.orderOf == 'Foody') {
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
        riderEarning: order.riderEarning,
        riderName
      });
    }
    else if (order.orderOf == 'Cyr') {
      socket.emit('RiderAcceptedCyrOrder', {
        orderId: order._id,
        userId: order.userId,
        otp: order.otp,
        riderEarning: order.riderEarning,
      });
    }

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
    if (order.orderOf == 'Foody') {
      socket.emit('RiderRejectedOrder', {
        riderId: order._id,
        restaurantName: order.restaurantName,
        restaurantAddress: order.restaurantAddress,
        userDeviceToken: order.userDeviceToken,
        restroDeviceToken: order.restroDeviceToken,
        userAddress: order.userAddress,
        userId: order.userId,
        restaurantId: order.restaurantId,
        foodItems: order.foodItems,
        totalItems: order.totalItems,
        bill: order.bill,
        city: order.city,
        restroEarning: order.restroEarning,
        riderEarning: order.riderEarning,
        riderName
      });
    }
    else if (order.orderOf == 'Cyr') {
      socket.emit('RiderRejectedCyrOrder', {
        orderId: order._id,
        userId: order.userId,
        otp: order.otp,
        city: order.fromLocation?.city,
        vehicleType: order.vehicleType,
      });
    }

    console.log('Emitted RiderRejectedOrder:', order);
    setRefresh(true); // Trigger refresh or update state as needed
  };


  // socket.on('RiderOrderInform', async (data) => {
  //   //do if data.riderId equals this rider._id then only execute next lines
  //   const riderData = await AsyncStorage.getItem('Riderdata');
  //   const rider = JSON.parse(riderData); 
  //   console.log('test', data.riderId, rider._id);
  //   if(data.riderId == rider._id){
  //     console.log('checked cleared');
  //     setUserInfo({
  //       address: data.data.userAddress,
  //       userId: data.data.userId,
  //       restaurantId: data.restaurantId,
  //       foodItems: data.foodItems,
  //       totalItems: data.totalItems,
  //       bill: data.bill,
  //       restroEarning: data.restroEarning,
  //       riderEarning: data.riderEarning,
  //       city: data.city
  //     });
  //   }
  // });

  // Simulate receiving socket data
  useEffect(() => { // Ensure to set up your socket connection properly
    socket.on('OrderAcceptedbyRider', (data) => {
      console.log('checking12345 rani---------------->', data, Riderdata._id)
      if (data.riderId == Riderdata?._id) {
        setOrderOf('Foody')
        setOrderId(data.orderId);
        console.log('Go to Map--------------------');
        setMap(true);
      }
    });

    // Clean up socket on unmount
    return () => {
      socket.off('OrderAcceptedbyRider');
    };
  }, []);

  useEffect(() => { // Ensure to set up your socket connection properly
    socket.on('CyrRideAcceptedbyRider', (data) => {
      console.log('checking12345 rani---------------->', data, Riderdata._id)
      if (data.riderId == Riderdata?._id) {
        setOrderOf('Cyr')
        setOrderId(data.orderId);
        console.log('Go to Map--------------------');
        setMap(true);
      }
    });

    // Clean up socket on unmount
    return () => {
      socket.off('CyrRideAcceptedbyRider');
    };
  }, []);

  // Navigate to MapDirection screen when `orderId` is set and `map` is true
  useEffect(() => {
    if (map && orderId) {
      setLoading(false);
      if (orderOf == 'Foody') {
        props.navigation.push("FoodMapDirection", { orderId, userInfo, reachedRestro: false });
      }
      else if (orderOf == 'Cyr') {
        props.navigation.push("CyrMapDirection", { orderId, userInfo });
      }
    }
  }, [map, orderId]);

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      {Riderdata?.verified ? 
       (
        <ScrollView>
           <View style={styles.header}>
            <View style={styles.toggle}>
              <Switch value={online} onValueChange={onToggleSwitch} color='#ffff00' />
              <Text style={online ? { color: '#ffff00' } : { color: 'white' }}>{online ? 'Online' : 'Offline'}</Text>
            </View>
            <TouchableOpacity
              style={{ marginHorizontal: 5 }}
              onPress={() => { props.navigation.push("PeakZonesScreen", { city: Riderdata?.city }) }}>
              <Icon name='arrow-trend-up' size={22} color='white' style={styles.icon} />
            </TouchableOpacity>
          </View>
          {/*** Greeting *****/}
          <View>
            <Text style={styles.greetingText}>{greeting} {Riderdata?.riderName}!</Text>
          </View>
    
          {/* Display fetched orders */}
          <View style={styles.ordersContainer}>
            {orders.length > 0 ? (
              orders.map((order, index) => (
                <View key={index} style={styles.orderBox}>
                  {order.orderOf === 'Foody' && (
                    <>
                      <Text style={[styles.orderTextHead, { textAlign: 'center', fontWeight: 'bold' }]}>Order from Restaurant</Text>
                      <Text style={styles.orderText}>Restaurant: {order.restaurantName}</Text>
                      <Text style={styles.orderText}>Destination: {order.userAddress}</Text>
                      <Text style={styles.orderText}>Earning: Rs{order.riderEarning}</Text>
                    </>
                  )}
                  {order.orderOf === 'Cyr' && (
                    <>
                      <Text style={[styles.orderTextHead, { textAlign: 'center', fontWeight: 'bold' }]}>Order from CYR</Text>
                      <Text style={styles.orderText}>From: {order.fromLocation?.placeName}</Text>
                      <Text style={styles.orderText}>To: {order.toLocation?.placeName}</Text>
                      <Text style={styles.orderText}>Distance: {order.distance} km</Text>
                      <Text style={styles.orderText}>Earnings: Rs {order.bill}</Text>
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
              <Text style={styles.noOrdersText}>
                "Abhi tak koi ride nahi mili... Lagta hai {Riderdata?.vehicleType || 'aapka vahan'} bhi soch rahi hai, 'Main kis liye bani hoon?' 🛵😢"
              </Text>
            )}
          </View>
    
          <View style={styles.progressContainer}>
            <Text style={{ color: '#ffff00', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>My Progress</Text>
            <View style={styles.progressBtn}>
              <TouchableOpacity
                onPress={() => { setEarningOf('Today') }}
                style={[styles.progressBtn2, earningOf == 'Today' ? { backgroundColor: '#68095F' } : null]}>
                <Text style={earningOf == 'Today' ? { color: 'white' } : { color: 'white' }}>Today</Text>
              </TouchableOpacity>
    
              <TouchableOpacity
                onPress={() => { setEarningOf('This Week') }}
                style={[styles.progressBtn2, earningOf == 'This Week' ? { backgroundColor: '#68095F' } : null]}>
                <Text style={earningOf == 'This Week' ? { color: 'white' } : { color: 'white' }}>This Week</Text>
              </TouchableOpacity>
            </View>
    
            <View style={styles.horizontalLine} >
              <View style={{ width: '80%' }} />
            </View>
    
            <View style={styles.earningContainer}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: 'white' }}>
                  Rs{earningOf == 'Today' ? (earningData?.todayEarnings || 0) : (earningData?.totalEarnings || 0)}
                </Text>
                <Text style={{ color: '#ffff00', fontWeight: 'bold' }}>Earnings</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: 'white' }}>
                  {earningOf == 'Today' ? (earningData?.todayOrders || 0) : (earningData?.totalOrders || 0)}
                </Text>
                <Text style={{ color: '#ffff00', fontWeight: 'bold' }}>Orders</Text>
              </View>
            </View>
          </View>
    
          {undeliveredOrders.map((order) => (
            <TouchableOpacity
              key={order._id}
              style={styles.orderBoxUndelivered}
              onPress={() =>
                props.navigation.push('FoodMapDirection', {
                  orderId: order._id,
                  userId: order.orderedBy,
                  reachedRestro: false
                })
              }
            >
              <Text style={[styles.orderTextHead, { fontWeight: 'bold', textAlign: "center" }]}>Pending Order from Foody</Text>
              <Text style={styles.orderText}>Order ID: {order._id}</Text>
              <Text style={styles.orderText}>Earnings: {order.riderEarning}</Text>
            </TouchableOpacity>
          ))}
    
          {undeliveredCyrOrders.map((order) => (
            <TouchableOpacity
              key={order._id}
              style={styles.orderBoxUndelivered}
              onPress={() =>
                props.navigation.push('CyrMapDirection', {
                  orderId: order._id,
                  userId: order.bookedBy
                })
              }
            >
              <Text style={[styles.orderTextHead, { fontWeight: 'bold', textAlign: "center" }]}>Pending Ride from CYR</Text>
              <Text style={styles.orderText}>Order ID: {order._id}</Text>
              <Text style={styles.orderText}>Earning: {order.riderEarning}</Text>
            </TouchableOpacity>
          ))}
    
          <View>
            <Image source={require("../assets/riderImg.png")} style={{ width: '100%', aspectRatio: 1, height: 'auto', resizeMode: 'contain' }} />
          </View>
        </ScrollView>
          ) :
      (
      <View style={styles.verificationContainer}>
           <LottieView source={require('../assets/Animations/verifying.json')}
           style={styles.lottie} autoPlay loop />
      
        <Text style={{padding:10 ,color:'white', textAlign:'center', fontStyle: 'italic', fontSize:20, fontWeight:'800'}}>
          Your RiderId verification is under process. It may take few hours to verify.
          </Text>
      </View>
      ) 
     }
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#68095F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Center the title
    padding: 10,
  },
  toggle: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
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
    backgroundColor: '#68095F',
    marginBottom: 10
  },
  orderBoxUndelivered: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#9f0d91',
    borderRadius: 5,
    width: '90%',
    marginHorizontal: '5%'
  },
  orderBox: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#9f0d91',
    borderRadius: 5,
  },
  orderTextHead: {
    color: '#ffff00',
    fontSize: 16,
  },
  orderText: {
    color: 'white',
    fontSize: 16,
  },
  noOrdersText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 20,
    color: '#ffff00',
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
  greetingText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: 'bold',
    marginTop: 10
  },
  progressContainer: {
    padding: 15,
    backgroundColor: '#9f0d91',
    borderRadius: 20,
    width: '90%',
    marginHorizontal: '5%'
  },
  progressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 10
  },
  progressBtn2: {
    padding: 8,
    borderRadius: 15
  },
  earningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: 10
  },
  horizontalLine: {
    height: 1,
    marginHorizontal: 30,
    backgroundColor: '#b9b3b9',
  },
  verificationContainer: {
    flex: 1,
   justifyContent:'center',
   alignItems: 'center'
  },
  lottie: {
    width: '60%',
    height: '60%',
  }
});
