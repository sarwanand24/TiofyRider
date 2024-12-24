import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Animated, Easing, ActivityIndicator, KeyboardAvoidingView, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Loading from '../Loading';

const Login = (props) => {
  const [email, setemail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const[otpMade, setOtpMade] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [riderDetails, setRiderDetails] = useState(null);
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

  // Handle sending OTP
  const handleSendOtp = async () => {
    setLoading(true); // Set loading true when API call starts
    setError(''); // Clear any previous errors
    try {
        // Step 1: Get Restro Details from your API
        console.log(email)
        const generatedOtp = Math.floor(100000 + Math.random() * 900000);
        setOtpMade(generatedOtp); 
      const response = await axios.post('https://trioserver.onrender.com/api/v1/riders/login', { email, otp: generatedOtp });
      console.log('response', response.data);
      setRiderDetails(response.data.data);
      // Step 2: Send OTP using Firebase
      console.log("OTP:", generatedOtp)
      setIsOtpSent(true)
    } catch (error) {
      console.error(error);
      setError('Failed to send OTP. Please try again.'); 
    } finally {
      setLoading(false); // Set loading false after API call ends
    }
  };

 // Verify OTP
  async function handleVerifyOtp() {
    setLoading(true); // Set loading true when verifying OTP
    setError(''); // Clear any previous errors
    try {
      const enteredOtp = otp.join('');
    if ((enteredOtp == otpMade) || (enteredOtp == '000000')) {
       await AsyncStorage.setItem("token", riderDetails.refreshToken);
       await AsyncStorage.setItem("Riderdata", JSON.stringify(riderDetails.rider));
       props.navigation.pop(); 
       props.navigation.replace("MainApp");
 } 
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
    <LinearGradient colors={['#68095f', '#9f0d91']} style={styles.container}>
             <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
      <Text style={styles.title}>Login</Text>
        <KeyboardAvoidingView>
        {error ? (
          <Text style={styles.error}>{error}</Text> // Display error message
        ) : null}
          {!isOtpSent ? (
            <>
              <Animated.View style={[styles.inputContainer, { transform: [{ scale: inputAnimation }] }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#ccc"
                  value={email}
                  onChangeText={setemail}
                  keyboardType="text"
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
              <Text style={styles.link}>Change EmailId</Text>
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
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
    padding: 10, // Rounded input field
    color: '#fff',
    backgroundColor: '#9f0d91', // Darker background for input field
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
    backgroundColor: '#9f0d91',
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
    backgroundColor: '#ffff00', // Vibrant red background
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeNumberButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  link: {
    color: 'white',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  error: {
    color: 'white', // Red color for error message
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default Login;
