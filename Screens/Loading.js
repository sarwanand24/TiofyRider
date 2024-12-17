import React from 'react';
import {
    StyleSheet,
    View,
    ActivityIndicator,
    Text,
    StatusBar
} from 'react-native';
import LottieView from 'lottie-react-native';

const Loading = () => {

    return (
        <View style={styles.loading}>
                   <StatusBar hidden={true} />
           <LottieView source={require('../assets/Animations/loading.json')}
           style={styles.lottie} autoPlay loop />
        </View>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#68095f'
    },
    lottie: {
        width: '100%',
        height: '100%',
      }
});

export default Loading;
