import React from 'react';
import {
    StyleSheet,
    View,
    ActivityIndicator,
    Text
} from 'react-native';
import LottieView from 'lottie-react-native';

const Loading = () => {

    return (
        <View style={styles.loading}>
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
        backgroundColor: 'rgba(245, 95, 45, 0.5)'
    },
    lottie: {
        width: '100%',
        height: '100%',
      }
});

export default Loading;
