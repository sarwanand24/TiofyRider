import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Easing, ActivityIndicator, Image,
  ScrollView, Alert,
  KeyboardAvoidingView,
  StatusBar
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import ImagePicker from 'react-native-image-crop-picker';
import Autocomplete from 'react-native-autocomplete-input';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loading from '../Loading';

const Signup = (props) => {
  const [riderName, setRiderName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [drivingLicenseImage, setDrivingLicenseImage] = useState(null);
  const [aadharImage, setAadharImage] = useState(null);
  const [address, setAddress] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [alternativeMobileNo, setAlternativeMobileNo] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [query, setQuery] = useState('');
  const [riderDetails, setRiderDetails] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [ifscError, setIfscError] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);


  // Animations
  const buttonAnimation = useRef(new Animated.Value(1)).current;

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
  }, []);

  const validateEmail = (email) => {
    // Regex for validating email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    } else {
      setEmailError('');
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('riderName', riderName);
      formData.append('email', email);
      formData.append('address', address);
      formData.append('mobileNo', mobileNo);
      formData.append('alternativeMobileNo', alternativeMobileNo);
      formData.append('password', password);
      formData.append('vehicleName', vehicleName);
      formData.append('vehicleNo', vehicleNo);
      formData.append('vehicleType', vehicleType);
      formData.append('drivingLiscenceImg', drivingLicenseImage);
      formData.append('aadharImg', aadharImage);
      formData.append('profileImg', profilePhoto);
      formData.append('city', city);
      formData.append('accountNumber', accountNumber);
      formData.append('ifscCode', ifscCode);
      formData.append('bankName', bankName);
      formData.append('branch', branch);


      const response = await axios.post('https://trioserver.onrender.com/api/v1/riders/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response.data.data.Rider);
      // Handle successful signup
      console.log('response--->', response.data.data)
      setRiderDetails(response.data.data);
      console.log('SUCCESS SIGNUP');
      await AsyncStorage.setItem("token", response.data.data.refreshToken);
      await AsyncStorage.setItem("Riderdata", JSON.stringify(response.data.data.Rider));
      props.navigation.pop();
      props.navigation.replace("MainApp");
    } catch (error) {
      Alert.alert('Error in Signup, Please try again later.')
      console.error(error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const pickImage = (type) => {
    const options = {
      cropping: true,
      mediaType: 'photo',
      includeBase64: true,
      // compressImageQuality: 0.8
    };

    if (type === 'drivingLicense') {
      ImagePicker.openPicker(options).then(image => {
        const data = `data:${image.mime};base64,${image.data}`;
        setDrivingLicenseImage(data);
      }).catch(err => console.log(err));
    } else if (type === 'profilePhoto') {
      ImagePicker.openPicker(options).then(image => {
        const data = `data:${image.mime};base64,${image.data}`;
        setProfilePhoto(data);
      }).catch(err => console.log(err));
    }
    else {
      ImagePicker.openPicker(options).then(image => {
        const data = `data:${image.mime};base64,${image.data}`;
        setAadharImage(data);
      }).catch(err => console.log(err));
    }
  };

  const fetchCities = async (text) => {
    setQuery(text);
    if (text.length >= 2) {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search`, {
          params: {
            q: text,
            format: 'json',
            addressdetails: 1,
            limit: 10,
          },
          headers: {
            'User-Agent': 'TiofyRider/1.0'  // Replace with your app's name
          }
        }
        );
        setCitySuggestions(response.data || []);
      } catch (error) {
        console.error('Error fetching city data: ', error);
      }
    } else {
      setCitySuggestions([]);
    }
  };

  const handleCitySelection = (selectedCity) => {
    const formattedCity = `${selectedCity.name}, ${selectedCity.address.state}, ${selectedCity.address.country}`;
    setCity(formattedCity);
    setQuery(formattedCity);
    setCitySuggestions([]); // Clear suggestions after selection
  };

  const fetchBankDetails = async () => {
    if (!ifscCode.trim() || !(ifscCode?.length === 11)) {
      setIfscError('Please enter a valid IFSC code.');
      return;
    }

    try {
      console.log('code---', ifscCode)
      const response = await axios.get(`https://ifsc.razorpay.com/${ifscCode}`, 
        {
          headers: {
            'User-Agent': 'TiofyRider/1.0',  // Replace with your app's name
            'Content': 'application/json',
          }
        }
      );
      console.log(response)
      setBankName(response.data.BANK || '');
      setBranch(response.data.BRANCH || '');
      setIfscError(''); // Clear error if successful
    } catch (error) {
      console.error('Error fetching bank details:', error);
      setIfscError('Invalid IFSC code. Please try again.');
      setBankName('');
      setBranch('');
    }
  };

  useEffect(()=>{
    fetchBankDetails();
  },[ifscCode])


  if (loading) {
    return (
      <Loading />
    )
  }

  return (
    <LinearGradient colors={['#68095f', '#9f0d91']} style={styles.container}>
             <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
      <ScrollView>
        <KeyboardAvoidingView>
        <Text style={styles.title}>Signup</Text>
        <View>
          <TextInput
            style={styles.input}
            placeholder="Rider Name"
            placeholderTextColor="#ccc"
            value={riderName}
            onChangeText={setRiderName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#ccc"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('drivingLicense')}>
            <Text style={styles.uploadButtonText}>{drivingLicenseImage ? 'Change Driving License Image' : 'Upload Driving License Image'}</Text>
          </TouchableOpacity>
          {drivingLicenseImage && (
            <Image source={{ uri: drivingLicenseImage }} style={styles.imagePreview} />
          )}
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('profilePhoto')}>
            <Text style={styles.uploadButtonText}>{profilePhoto ? 'Change Profile Photo' : 'Upload Profile Photo'}</Text>
          </TouchableOpacity>
          {profilePhoto && (
            <Image source={{ uri: profilePhoto }} style={styles.imagePreview} />
          )}
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('aadharImage')}>
            <Text style={styles.uploadButtonText}>{aadharImage ? 'Change Aadhar Image' : 'Upload Aadhar Image'}</Text>
          </TouchableOpacity>
          {aadharImage && (
            <Image source={{ uri: aadharImage }} style={styles.imagePreview} />
          )}
          <TextInput
            style={styles.input}
            placeholder="Address"
            placeholderTextColor="#ccc"
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            style={styles.input}
            placeholder="Mobile No"
            placeholderTextColor="#ccc"
            value={mobileNo}
            onChangeText={setMobileNo}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <TextInput
            style={styles.input}
            placeholder="Alternative Mobile No (Optional)"
            placeholderTextColor="#ccc"
            value={alternativeMobileNo}
            onChangeText={setAlternativeMobileNo}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#ccc"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Vehicle Name"
            placeholderTextColor="#ccc"
            value={vehicleName}
            onChangeText={setVehicleName}
          />
          <TextInput
            style={styles.input}
            placeholder="Vehicle No"
            placeholderTextColor="#ccc"
            value={vehicleNo}
            onChangeText={setVehicleNo}
          />

          <View>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setDropdownVisible(true)}
            >
              <Text style={styles.dropdownText}>
                {vehicleType || 'Select Vehicle Type'}
              </Text>
            </TouchableOpacity>

            {dropdownVisible && (
              <View style={styles.dropdownListContainer}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setVehicleType('Bike');
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>Bike</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setVehicleType('Car');
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>Car</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setVehicleType('Toto');
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>Toto</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Autocomplete
            data={citySuggestions}
            defaultValue={query}
            onChangeText={fetchCities}
            flatListProps={{
              keyExtractor: (item) => item.place_id.toString(), // Ensure unique key for each item
              renderItem: ({ item }) => (
                <TouchableOpacity onPress={() => handleCitySelection(item)}>
                  <Text style={styles.suggestionItem}>
                    {item.name}, {item.address.state}, {item.address.country}
                  </Text>
                </TouchableOpacity>
              ),
            }}
            inputContainerStyle={styles.inputContainer}
            listStyle={styles.listStyle}
            style={styles.input}
            placeholder="City"
            placeholderTextColor="#ccc"
          />

          <TextInput
            style={styles.input}
            placeholder="Enter Bank Account Number"
            placeholderTextColor="#ccc"
            value={accountNumber}
            onChangeText={setAccountNumber}
          />

          <TextInput
            style={styles.input}
            placeholder="Enter IFSC Code"
            placeholderTextColor="#ccc"
            value={ifscCode}
            onChangeText={(value) => {
              setIfscCode(value);
              if (value.length === 11) { // Trigger fetch when IFSC code is 11 characters long
                fetchBankDetails();
              }
            }}
          />
          {ifscError ? <Text style={styles.errorText}>{ifscError}</Text> : null}

          <TextInput
            style={[styles.input, { backgroundColor: '#f0f0f0', color: 'black' }]} // Disabled styling
            placeholder="Bank Name"
            placeholderTextColor="#999"
            value={bankName} 
            onChangeText={setBankName}
          />

          <TextInput
            style={[styles.input, { backgroundColor: '#f0f0f0', color: 'black' }]} // Disabled styling
            placeholder="Branch"
            placeholderTextColor="#999"
            value={branch} 
            onChangeText={setBranch}
          />


          <Animated.View style={[styles.button, { transform: [{ scale: buttonAnimation }] }]}>
            <TouchableOpacity style={styles.buttonInner} onPress={handleSignup}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0f0c29', // Dark retro background
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white', // Neon pink
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'verdana', // Retro font style
    textShadowColor: '#ff8c00', // Neon orange shadow
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  input: {
    height: 50,
    borderColor: '#f50057', // Neon magenta
    borderWidth: 2,
    paddingHorizontal: 15,
    marginBottom: 15,
    color: '#ffffff', // White text
    backgroundColor: '#1a1a2e', // Darker retro background
    fontFamily: 'verdana', // Retro font style
  },
  uploadButton: {
    backgroundColor: '#e91e63', // Neon pink
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#ff8c00', // Neon orange shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  uploadButtonText: {
    color: '#ffffff', // White text
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'verdana', // Retro font style
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 15,
    borderColor: '#f50057', // Neon magenta border
    borderWidth: 2,
  },
  button: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonInner: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffff00', // Neon magenta
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff8c00', // Neon orange shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  buttonText: {
    color: 'black', // White text
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'verdana', // Retro font style
  },
  errorText: {
    color: '#ff1744', // Bright red for errors
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    borderWidth: 0,
  },
  listStyle: {
    borderWidth: 1,
    borderColor: '#f50057', // Neon magenta border
    borderRadius: 5,
    backgroundColor: '#1a1a2e', // Dark retro background for the list
    marginTop: 5,
    paddingVertical: 5,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f50057',  // Neon magenta bottom border
    color: '#ffffff',  // White text
    backgroundColor: '#2e2e3a', // Slightly lighter dark background for each item
    borderRadius: 5,
    fontFamily: 'verdana', // Retro font style
  },
  dropdown: {
    height: 50,
    borderColor: '#f50057', // Neon magenta
    borderWidth: 2,
    borderRadius: 25,
    paddingHorizontal: 15,
    justifyContent: 'center',
    backgroundColor: '#1a1a2e', // Dark retro background
    marginBottom: 15,
  },
  dropdownText: {
    color: '#ffffff', // White text
    fontFamily: 'verdana', // Retro font style
  },
  dropdownListContainer: {
    borderWidth: 2,
    borderColor: '#f50057', // Neon magenta
    borderRadius: 10,
    backgroundColor: '#2e2e3a', // Dark background for dropdown items
    position: 'absolute',
    zIndex: 1000,
    width: '100%',
    paddingVertical: 5,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f50057', // Neon magenta border
  },
  dropdownItemText: {
    color: '#ffffff', // White text
    fontFamily: 'verdana', // Retro font style
  },

});

export default Signup;
