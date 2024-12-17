import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Notifications = ({onMarkSeen, onUpdateBadge}) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    onMarkSeen();
    const fetchNotifications = async () => {
      const storedNotifications = JSON.parse(await AsyncStorage.getItem('notifications')) || [];
      setNotifications(storedNotifications);
    };

    fetchNotifications();
  }, []);

  return (
    <View style={styles.container}>
          <StatusBar hidden={true} />
      <Text style={styles.header}>Notifications</Text>
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.notificationItem}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.timestamp}>{new Date(item.receivedAt).toLocaleString()}</Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noNotifications}>No notifications available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#68095F',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#ffff00'
  },
  notificationItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#9f0d91',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#ffff00'
  },
  body: {
    fontSize: 16,
    color: 'white',
  },
  timestamp: {
    fontSize: 14,
    color: '#ffff00',
    marginTop: 8,
  },
  noNotifications: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 32,
  },
});

export default Notifications;
