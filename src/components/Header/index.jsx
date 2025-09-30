import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import profile from '../../assets/profile.png';

const Header = () => {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);

  const handleQRCode = () => {
    navigation.navigate('QRCodeSlidePage');
  };
  const handleProfile = () => {
    navigation.navigate('UserProfile');
  };
  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) { return; }

      const response = await axios.get(
        `${BASE_URL}/api/user-profile`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const user = response.data.user;
      setUserProfile(user);
      await AsyncStorage.setItem('userProfile', JSON.stringify(user));
    } catch (err) {
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const getProfileImageSource = () => {
    const photo = userProfile?.photo?.trim();
    if (!photo) { return profile; }

    if (photo.startsWith('data:image') || photo.startsWith('http')) {
      return { uri: photo };
    }

    return { uri: `https://letsmeet-backend-47lv.onrender.com/${photo}` };
  };

  const handleChatPress = async () => {
    navigation.navigate('UserListScreen');
  };

  return (
    <SafeAreaView style={{ backgroundColor: '#34495e' }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={styles.customHeader}>
        <View style={{ flexDirection: 'row', gap: 25 }}>
          <TouchableOpacity onPress={handleProfile}>
            <Image
              source={getProfileImageSource()}
              style={styles.profile}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleQRCode}>
            <MaterialCommunityIcons name="qrcode-scan"
              size={30}
              color="#f9efef"
              style={styles.Chatstyle}
            />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 25 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Connection')}>
            <Ionicons
              name="people-outline"
              size={30}
              color="#f9efef"
              style={styles.Chatstyle}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChatPress}>
            <Ionicons
              name="chatbubbles-outline"
              size={30}
              color="#f9efef"
              style={styles.Chatstyle}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Header;

const styles = StyleSheet.create({
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#34495e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
    height: 70,
  },
  profile: {
    width: 32,
    height: 32,
    borderRadius: 15,
  },
  Chatstyle: {
    justifyContent: 'center',
    marginVertical: 'auto',
  },
});
