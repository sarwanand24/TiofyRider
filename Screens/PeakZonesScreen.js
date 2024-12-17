import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import Loading from './Loading';

const PeakZonesScreen = ({ route }) => {
  const { city } = route.params; // Get the city from the route params
  const [restaurants, setRestaurants] = useState([]);
  const [peakZones, setPeakZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('restaurants');
  const [activeButton, setActiveButton] = useState('restaurants'); // Toggle between 'restaurants' and 'peakZones'

  useEffect(() => {
    fetchData(city);
  }, [city]);

  const fetchData = async (city) => {
    try {
      const response = await fetch(`https://trioserver.onrender.com/api/v1/riders/getPeakOrderZones/${city}`);

      // Log the raw response to inspect its content
      const textResponse = await response.text();
      console.log('Raw response:', textResponse);

      // Check if the response content is JSON
      if (response.ok) {
        try {
          const data = JSON.parse(textResponse); // Try to parse the text as JSON
          if (data.restaurants) {
            setRestaurants(data.restaurants);
          }
          if (data.peakZones) {
            setPeakZones(data.peakZones);
          }
        } catch (jsonError) {
          console.error('Error parsing JSON:', jsonError);
          setLoading(false); // Stop loading
        }
      } else {
        throw new Error('Failed to fetch data');
      }
      
      setLoading(false); // Stop loading if everything is okay
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false); // Stop loading in case of error
    }
  };

  const renderRestaurantItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.restaurantName}>{item.restaurantName}</Text>
      <Text style={styles.orderCount}>Address: {item.address}</Text>
      <Text style={styles.city}>City: {item.city}</Text>
      <Text style={styles.ratings}>Ratings: {item.ratings}</Text>
    </View>
  );

  const renderPeakZoneItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.placeName}>{item._id}</Text>
      <Text style={styles.orderCount}>Orders Range: {item.orderCount}</Text>
    </View>
  );

  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <View style={styles.container}>
             <StatusBar hidden={true} />
      <Text style={styles.title}>Peak Zones</Text>
      <View style={styles.buttonContainer}>
    <TouchableOpacity
      style={[
        styles.button,
        activeButton === 'restaurants' ? styles.activeButton : styles.inactiveButton,
      ]}
      onPress={() => {
        setActiveButton('restaurants');
        setView('restaurants');
      }}
    >
      <Text style={styles.buttonText}>Peak Restaurants</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.button,
        activeButton === 'peakZones' ? styles.activeButton : styles.inactiveButton,
      ]}
      onPress={() => {
        setActiveButton('peakZones');
        setView('peakZones');
      }}
    >
      <Text style={styles.buttonText}>Peak Zones for Cyr</Text>
    </TouchableOpacity>
  </View>

      <FlatList
        data={view === 'restaurants' ? restaurants : peakZones}
        keyExtractor={(item, index) => index.toString()}
        renderItem={view === 'restaurants' ? renderRestaurantItem : renderPeakZoneItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#68095F',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign:'center',
    color: '#ffff00'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom:20
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#ffff00',
  },
  inactiveButton: {
    backgroundColor: 'white',
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#9f0d91',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    elevation: 3,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color:'#ffff00'
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffff00'
  },
  orderCount: {
    fontSize: 16,
    color: 'white',
  },
  city: {
    fontSize: 14,
    color: '#777',
    color:'white'
  },
  ratings: {
    fontSize: 14,
    color: 'gold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PeakZonesScreen;
