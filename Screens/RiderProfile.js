import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';
import Loading from './Loading';
import { getAccessToken } from '../utils/auth';

const RiderProfile = () => {

    const [riderData, setRiderData] = useState(null);

    useEffect(() => {
      const fetchRiderData = async () => {
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
                  
                  setRiderData(response.data.data);
              } else {
                  console.log("No token found.");
              }
          } catch (error) {
              console.log("Error fetching rider data:", error);
          }
      };

      fetchRiderData();
  }, []);

    // Calculate the number of IDs in each history array
    const foodyRideHistoryCount = riderData ? riderData.foodyRideHistory.length : 0;
    const cyrRideHistoryCount = riderData ? riderData.cyrRideHistory.length : 0;
    const totalOrders = foodyRideHistoryCount + cyrRideHistoryCount;
  
    if (!riderData) {
      return <Loading />; // Or you can show a loading spinner or placeholder
    }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
      <Image
  source={{
    uri: riderData.profilePhoto
      ? riderData.profilePhoto.replace("http://", "https://")
      : null
  }}
  style={styles.profilePhoto}
/>

        <Text style={[styles.name, styles.glow]}>{riderData.riderName}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={[styles.subheading, styles.glow]}>Personal Information</Text>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{riderData.email}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{riderData.address}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Mobile Number:</Text>
          <Text style={styles.value}>{riderData.mobileNo}</Text>
        </View>
        {riderData.alternateMobileNo && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Alternate Mobile No:</Text>
            <Text style={styles.value}>{riderData.alternateMobileNo}</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsContainer}>
        <Text style={[styles.subheading, styles.glow]}>Vehicle Information</Text>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Vehicle Name:</Text>
          <Text style={styles.value}>{riderData.vehicleName}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Vehicle Number:</Text>
          <Text style={styles.value}>{riderData.vehicleNo}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Driving License:</Text>
          <Image
  source={{
    uri: riderData.drivingLiscense
      ? riderData.drivingLiscense.replace("http://", "https://")
      : null
  }}
  style={styles.licenseImage}
/>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={[styles.subheading, styles.glow]}>Status</Text>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Availability:</Text>
          <Text style={styles.value}>{riderData.availableStatus ? 'Available' : 'Not Available'}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.label}>City:</Text>
          <Text style={styles.value}>{riderData.city}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Total Money Earned:</Text>
          <Text style={styles.value}>Rs {riderData.moneyEarned}</Text>
        </View>
        <View style={styles.infoBox}>
                    <Text style={styles.label}>Total Number of Orders:</Text>
                    <Text style={styles.value}>{totalOrders}</Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>Total Number of Foody Orders:</Text>
                    <Text style={styles.value}>{foodyRideHistoryCount}</Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>Total Number of CYR Orders:</Text>
                    <Text style={styles.value}>{cyrRideHistoryCount}</Text>
                </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Joined on: {new Date(riderData.createdAt).toDateString()}</Text>
        <Text style={styles.footerText}>Last Updated: {new Date(riderData.updatedAt).toDateString()}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#e0e0e0',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginTop: 15,
  },
  detailsContainer: {
    marginBottom: 25,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8f8f8',
    marginBottom: 15,
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  label: {
    color: '#e0e0e0',
    fontSize: 16,
  },
  value: {
    color: '#f8f8f8',
    fontSize: 16,
    maxWidth: '65%',
    textAlign: 'right',
  },
  licenseImage: {
    width: 150,
    height: 100,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  glow: {
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#e0e0e0',
    fontSize: 14,
    marginTop: 5,
  },
});

export default RiderProfile;
