import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';

const More = (props) => {

    const handleLogout = async() => {
       await AsyncStorage.removeItem('token');
       await AsyncStorage.removeItem('Riderdata');
        props.navigation.replace('Auth')
    }
    
    return (
        <View style={styles.container}>
                   <StatusBar hidden={true} />
            <Text style={styles.headerText}>More</Text>
            <View style={styles.optionsContainer}>
                <TouchableOpacity 
                onPress={()=>{ props.navigation.push('RiderProfile')} }
                style={styles.optionButton}>
                    <Icon name='user' size={22} color='#ffff00' style={styles.icon} />
                    <Text style={styles.optionText}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   onPress={()=>{ props.navigation.push('HelpSupportScreen')} }
                style={styles.optionButton}>
                    <Icon name='headset' size={22} color='#ffff00' style={styles.icon} />
                    <Text style={styles.optionText}>Help & Support</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   onPress={handleLogout}
                style={styles.optionButton}>
                    <Icon name='right-from-bracket' size={22} color='#ffff00' style={styles.icon} />
                    <Text style={styles.optionText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#68095F',
        padding: 20,
    },
    headerText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffff00',
        marginBottom: 20,
        textAlign: 'center',
    },
    optionsContainer: {
        backgroundColor: '#9f0d91',
        borderRadius: 10,
        paddingVertical: 15,
        paddingHorizontal: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginVertical: 8,
        borderRadius: 8,
        backgroundColor: '#68095f',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    icon: {
        marginRight: 10,
    },
    optionText: {
        fontSize: 18,
        color: 'white',
        fontWeight: '500',
    },
});

export default More;
