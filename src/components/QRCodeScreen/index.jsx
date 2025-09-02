import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, useColorScheme } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

const QRCodeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const qrCodeRef = useRef();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get('https://letsmeet-backend-47lv.onrender.com/api/user-profile', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const user = response.data.user;

        setUserData({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          linkedin: user.linkedin_url,
          jobRole: user.attendees_role,
          preferences: Array.isArray(user.preference) ? user.preference.join(', ') : 'None',
        });
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const qrValue = userData ? JSON.stringify(userData) : '';

  return (
    <>
      <StatusBar barStyle={useColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#e8effc' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerTitle}
            onPress={() => navigation.replace('Scanner')}
          >
            <Text style={{ fontSize: 20, paddingHorizontal: 10, color: '#000' }}>Scan</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Profile QR Code</Text>
            <View style={styles.qrBox}>
              {loading ? (
                <ActivityIndicator size="large" color="#34495e" />
              ) : (
                <QRCode
                  value={qrValue}
                  size={180}
                  getRef={(c) => (qrCodeRef.current = c)}
                />
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

export default QRCodeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    position: 'fixed',
  },
  card: {
    marginTop: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: 295,
    height: 350,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 30,
    marginTop: 15,
  },
  qrBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    minWidth: 200,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 110,
    justifyContent: 'space-between',
    width: '60%',
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
});
