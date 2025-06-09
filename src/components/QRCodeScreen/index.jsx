import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
// import { useNavigation } from '@react-navigation/native';
import ellipse from '../../assets/qrcodeFirst.png'
import ellipseTwo from '../../assets/qrcodetwo.png'
import ellipseBottom from '../../assets/qrcodethree.png'
import ellipseBottomTwo from '../../assets/qrcodefour.png'
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import scanner from '../../assets/vector.png'

const QRCodeScreen = ({ navigation }) => {

  const [userData, setUserData] = useState({})

  useEffect(() => {
    const fetchUserData = async () => {
      console.log("User Data:", userData);

      try {
        console.log("Sending request to login API...");
        const token = await AsyncStorage.getItem('token')
        console.log("Token from AsyncStorage:", token);
        const response = await axios.get(`https://letsmeet-backend-47lv.onrender.com/api/user-profile`, {
          headers: {
            'Content-Type': "application/json",
            'Authorization': `Bearer ${token}`
          }
        }
        )
        console.log("Login successful, token received:", response.data.token); // ✅ Debug

        const user = response.data.user

        setUserData({
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          linkedin: user.linkedin_url,
          jobRole: user.attendees_role,
          preferences: Array.isArray(user.preference) ? user.preference.join(', ') : 'None',
        })
      } catch (error) {
        console.log(`Error fetching the user data ${error}`)
      }
    }
    fetchUserData()
  }, [])

  const qrValue = userData ? JSON.stringify(userData) : '';

  const handleShare = async () => {
    try {
      await Share.share({
        message: qrValue,
      });
    } catch (error) {
      console.log('Share error:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={ellipse} style={styles.ellipseTopOne} />
      <Image source={ellipseTwo} style={styles.ellipseTopTwo} />
      <Image source={ellipseBottom} style={styles.ellipseBottomTwo} />
      <Image source={ellipseBottomTwo} style={styles.ellipseBottom} />
      {/* Top Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Scanner')} style={styles.headerTitle}>
          <Image source={scanner} />
          <Text style={{ fontSize: 20, paddingLeft: 10 }}>Scan</Text>
        </TouchableOpacity>
        <View style={{ width: 24 }} /> {/* Placeholder to center title */}
      </View>

      {/* QR Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scan QR</Text>
        <View style={styles.qrBox}>
          {userData ? (
            <QRCode value={qrValue} size={180} />
          ) : (
            <Text style={{ color: '#fff' }}>Loading...</Text>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleShare}>
            {/* Replace icon with text */}
            <Text style={styles.buttonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default QRCodeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEEFF',
    padding: 20,
    alignItems: 'center'
  },
  header: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    display: "flex",
    flexDirection: "row",
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    position: "fixed",
    top: -10,
    right: -140,
  },
  headerBackText: {
    fontSize: 35,
    fontWeight: "bold",
    color: '#000',
    position: "fixed",
    top: -35,
    left: -130,
  },
  card: {
    marginTop: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: 295,
    height: 485
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 30,
    marginTop: 15
  },
  qrBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 110,
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  button: {
    width: 118,
    height: 36,
    backgroundColor: '#E4E4E4',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  ellipseTopOne: {
    position: "absolute",
    top: -70,
    left: 0
  },
  ellipseTopTwo: {
    position: "absolute",
    top: -100,
    left: 50
  },
  ellipseBottom: {
    position: "absolute",
    bottom: -80,
    right: 0
  },
  ellipseBottomTwo: {
    position: "absolute",
    bottom: -80,
    left: 0
  },

});
