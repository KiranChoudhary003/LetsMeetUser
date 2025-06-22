import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Image, StyleSheet, TouchableOpacity, View, Alert,
} from 'react-native';
import profile from '../../assets/profile.png';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const Header = () => {
    const navigation = useNavigation();

    const [userProfile, setUserProfile] = useState(null);

    const handleQRCode = () => {
        navigation.navigate('QRCode');
    };

    const handleProfile = () => {
        navigation.navigate('UserProfile');
    };

    const fetchUserProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) { return; }

            const response = await axios.get('https://letsmeet-backend-47lv.onrender.com/api/user-profile', {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const user = response.data.user;
            setUserProfile(user);
            await AsyncStorage.setItem('userProfile', JSON.stringify(user));
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
            Alert.alert('Error', 'Failed to load profile.');
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const getProfileImageSource = () => {
        const photo = userProfile?.photo?.trim();
        if (!photo) return profile;

        if (photo.startsWith('data:image') || photo.startsWith('http')) {
            return { uri: photo };
        }

        return { uri: `https://letsmeet-backend-47lv.onrender.com/${photo}` };
    };

    const handleChatPress = async () => {
        await fetchUserProfile();
        navigation.navigate('UserListScreen');
    };

    return (
        <View style={styles.customHeader}>
            <View style={{ flexDirection: 'row', gap: 20 }}>
                <TouchableOpacity onPress={handleProfile}>
                    <Image
                        source={getProfileImageSource()}
                        style={styles.profile}
                        resizeMode="cover"
                    />                </TouchableOpacity>
                <TouchableOpacity onPress={handleQRCode}>
                    <Ionicons name="scan-outline" size={30} color="#f9efef" style={styles.Chatstyle} />
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 20 }}>
                <TouchableOpacity onPress={() => navigation.navigate('Connection')}>
                    <Ionicons name="people-outline" size={30} color="#f9efef" style={styles.Chatstyle} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleChatPress}>
                    <Ionicons name="chatbubbles-outline" size={30} color="#f9efef" style={styles.Chatstyle} />
                </TouchableOpacity>
            </View>
        </View>
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
        height: 60
    },

    profile: {
        width: 30,
        height: 30,
        borderRadius : 15
    },
    Chatstyle: {
        justifyContent: 'center',
        marginVertical: 'auto',

    },

});
