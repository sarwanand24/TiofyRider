import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';

const More = (props) => {
    return (
        <View style={styles.container}>
            <Text style={styles.headerText}>More</Text>
            <View style={styles.optionsContainer}>
                <TouchableOpacity 
                onPress={()=>{props.navigation.push('RiderProfile')}}
                style={styles.optionButton}>
                    <Icon name='user' size={22} color='#007AFF' style={styles.icon} />
                    <Text style={styles.optionText}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionButton}>
                    <Icon name='headset' size={22} color='#007AFF' style={styles.icon} />
                    <Text style={styles.optionText}>Help & Support</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
        padding: 20,
    },
    headerText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    optionsContainer: {
        backgroundColor: 'white',
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
        backgroundColor: '#f0f0f0',
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
        color: '#333',
        fontWeight: '500',
    },
});

export default More;
