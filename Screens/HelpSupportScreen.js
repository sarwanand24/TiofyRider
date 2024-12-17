import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, StatusBar } from 'react-native';

const HelpSupportScreen = () => {
  const email = "tiofybharat@gmail.com";
  const phone = "+91 7550894302";

  const handleEmailPress = () => Linking.openURL(`mailto:${email}`);
  const handlePhonePress = () => Linking.openURL(`tel:${phone}`);

  return (
    <ScrollView style={styles.container}>
             <StatusBar hidden={true} />
      <Text style={styles.header}>Help & Support</Text>
      <Text style={styles.description}>
        Welcome to our Help & Support center! We're here to assist you with any issues or questions you may have. 
        Please feel free to reach out to us through the contact details provided below.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Contact Us</Text>
        <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
          <Text style={styles.contactLabel}>Email:</Text>
          <Text style={styles.contactValue}>{email}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactItem} onPress={handlePhonePress}>
          <Text style={styles.contactLabel}>Phone:</Text>
          <Text style={styles.contactValue}>{phone}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>FAQs</Text>
        <Text style={styles.faqItem}>
          <Text style={styles.question}>Q: How can I reset my password?{'\n'}</Text>
          <Text style={styles.answer}>A: Go to the login page, click "Forgot Password," and follow the instructions.{'\n'}</Text>
        </Text>
        <Text style={styles.faqItem}>
          <Text style={styles.question}>Q: How do I update my account details?{'\n'}</Text>
          <Text style={styles.answer}>A: Navigate to the "Profile" section and edit your information.{'\n'}</Text>
        </Text>
        <Text style={styles.faqItem}>
          <Text style={styles.question}>Q: What if I face issues with my order?{'\n'}</Text>
          <Text style={styles.answer}>A: Contact us through the email or phone provided, and we’ll resolve it promptly.{'\n'}</Text>
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Feedback</Text>
        <Text style={styles.description}>
          Your feedback is important to us! Let us know how we can improve your experience. Send your suggestions to our email.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Support Hours</Text>
        <Text style={styles.description}>We are available to assist you during the following hours:</Text>
        <Text style={styles.supportHours}>Monday - Friday: 9 AM - 9 PM{'\n'}Saturday - Sunday: 10 AM - 6 PM</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#68095F',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffff00',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: 'white',
    lineHeight: 22,
    marginBottom: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffff00',
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#e9ecef',
  },
  contactLabel: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
  },
  contactValue: {
    fontSize: 16,
    color: '#007bff',
  },
  faqItem: {
    marginBottom: 15,
  },
  question: {
    fontWeight: 'bold',
    color: '#ffff00',
  },
  answer: {
    color: 'white',
    lineHeight: 22,
  },
  supportHours: {
    fontSize: 16,
    color: 'white',
    lineHeight: 22,
    marginTop: 5,
  },
});

export default HelpSupportScreen;
