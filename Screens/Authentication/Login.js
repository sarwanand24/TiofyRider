import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Animated, Easing, ActivityIndicator } from 'react-native';
import axios from 'axios';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Loading from '../Loading';

const Login = (props) => {
  const [mobileNo, setMobileNo] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [riderDetails, setRiderDetails] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false); // Add loading state
  const [error, setError] = useState(''); // Add error state

  // Animations
  const buttonAnimation = useRef(new Animated.Value(1)).current;
  const inputAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Button scaling animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonAnimation, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(buttonAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Input field fade-in animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(inputAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(inputAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  // Handle user authentication state change
  async function onAuthStateChanged(user) {
    console.log("User", user);
    if (user) {
      console.log('Success Login');
      // await AsyncStorage.setItem("token", riderDetails.accessToken);
      // await AsyncStorage.setItem("Riderdata", JSON.stringify(riderDetails.rider));
      // props.navigation.replace('RiderDashboard'); 
    }
  }

  // Handle sending OTP
  const handleSendOtp = async () => {
    setLoading(true); // Set loading true when API call starts
    setError(''); // Clear any previous errors
    try {
      // Step 1: Get Rider Details from your API
      console.log(mobileNo);   
      const response = await axios.post('https://trioserver.onrender.com/api/v1/riders/login', { mobileNo });
      console.log('response', response.data);
      setRiderDetails(response.data.data);

      // Step 2: Send OTP using Firebase
      const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
      signInWithPhoneNumber(`+91 ${mobileNo}`);
      setIsOtpSent(true);
    } catch (error) {
      console.error(error);
      setError('Failed to send OTP. Please try again.'); 
    } finally {
      setLoading(false); // Set loading false after API call ends
    }
  };

  // Send OTP via Firebase
  async function signInWithPhoneNumber(phoneNumber) {
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    setConfirm(confirmation);
  }

  // Verify OTP
  async function handleVerifyOtp() {
    setLoading(true); // Set loading true when verifying OTP
    setError(''); // Clear any previous errors
    try {
      const enteredOtp = otp.join('');
      await confirm.confirm(enteredOtp);
      console.log('Success Login4');
      await AsyncStorage.setItem("token", riderDetails.refreshToken);
      await AsyncStorage.setItem("Riderdata", JSON.stringify(riderDetails.rider));
      props.navigation.pop(); 
      props.navigation.replace('RiderDashboard'); 
    } catch (error) {
      console.log('Invalid code.');
      setError('Invalid OTP. Please try again.'); 
    } finally {
      setLoading(false); // Set loading false after OTP verification ends
    }
  }

  const otpRefs = useRef([]);

  // Handle OTP input change
  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
  newOtp[index] = value;
  setOtp(newOtp);
  if (value !== '' && index < otp.length - 1) {
    otpRefs.current[index + 1]?.focus();
  }
  };
  
  if(loading){
    return (
      <Loading />
    )
  }

  return (
    <LinearGradient colors={['#2c3e50', '#3498db']} style={styles.container}>
      <Text style={styles.title}>Login</Text>
        <View>
        {error ? (
          <Text style={styles.error}>{error}</Text> // Display error message
        ) : null}
          {!isOtpSent ? (
            <>
              <Animated.View style={[styles.inputContainer, { transform: [{ scale: inputAnimation }] }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number"
                  placeholderTextColor="#ccc"
                  value={mobileNo}
                  onChangeText={setMobileNo}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </Animated.View>
              <Animated.View style={[styles.button, { transform: [{ scale: buttonAnimation }] }]}>
                <TouchableOpacity style={styles.buttonInner} onPress={handleSendOtp}>
                  <Text style={styles.buttonText}>Proceed</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            <>
              <Text style={styles.otpTitle}>Enter OTP</Text>
              <View style={styles.otpContainer}>
                {otp.map((value, index) => (
                  <Animated.View key={index} style={{ transform: [{ scale: inputAnimation }] }}>
                    <TextInput
                      ref={ref => otpRefs.current[index] = ref}
                      style={styles.otpInput}
                      value={value}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      autoFocus={index === 0} // Automatically focus the first input
                    />
                  </Animated.View>
                ))}
              </View>
              <Animated.View style={[styles.button, { transform: [{ scale: buttonAnimation }] }]}>
                <TouchableOpacity style={styles.buttonInner} onPress={handleVerifyOtp}>
                  <Text style={styles.buttonText}>Verify OTP</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
          {isOtpSent && (
            <TouchableOpacity onPress={() => setIsOtpSent(false)} style={styles.changeNumberButton}>
              <Text style={styles.link}>Change Mobile Number</Text>
            </TouchableOpacity>
          )}
        </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff', // White color for title
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#fff',
    borderWidth: 2,
    padding: 10,
    borderRadius: 30, // Rounded input field
    color: '#fff',
    backgroundColor: '#333', // Darker background for input field
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff', // White color for OTP title
    textAlign: 'center',
    marginBottom: 10,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    height: 50,
    width: 40,
    borderColor: '#fff',
    borderWidth: 2,
    textAlign: 'center',
    color: '#fff',
    backgroundColor: '#333',
    borderRadius: 15, // Rounded OTP input
  },
  button: {
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonInner: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e74c3c', // Vibrant red background
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeNumberButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  link: {
    color: '#ff007f',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  error: {
    color: '#e74c3c', // Red color for error message
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default Login;
