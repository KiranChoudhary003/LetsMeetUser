import React, { useCallback, useEffect, useState } from 'react';
import {
    Image, Modal, StyleSheet, Text, TouchableOpacity, View, Alert, Linking,
    Platform, PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import profile from '../../assets/profile.png';
import axios from 'axios';
import { BlurView } from '@react-native-community/blur';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFocusEffect } from '@react-navigation/native';

const UserProfile = ({ navigation, route }) => {
    const [userProfile, setUserProfile] = useState({});
    const [profileView, setProfileView] = useState(false);

    const passedUser = route?.params?.user;
    const isViewingOwnProfile = !passedUser;

    const fetchProfileData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get('https://letsmeet-backend-47lv.onrender.com/api/user-profile', {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            setUserProfile(response.data.user);
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    useEffect(() => {
        if (passedUser) {
            setUserProfile(passedUser);
        } else {
            fetchProfileData();
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (!passedUser) fetchProfileData();
        }, [])
    );

    const requestGalleryPermission = async () => {
        if (Platform.OS === 'android') {
            const permissionType = Platform.Version >= 33
                ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
                : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

            const granted = await PermissionsAndroid.request(permissionType, {
                title: 'Permission',
                message: 'Allow access to gallery',
                buttonPositive: 'OK',
            });

            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    };

    const handleEditPhoto = async () => {
        const permissionGranted = await requestGalleryPermission();
        if (!permissionGranted) {
            Alert.alert('Permission Denied', 'Cannot access gallery');
            return;
        }

        launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async (response) => {
            if (response.didCancel || response.errorCode) return;

            const asset = response.assets?.[0];
            if (!asset?.uri) return;

            const formData = new FormData();
            formData.append('photo', {
                uri: asset.uri,
                type: asset.type,
                name: asset.fileName || 'photo.jpg',
            });

            try {
                const token = await AsyncStorage.getItem('token');
                await axios.put(
                    'https://letsmeet-backend-47lv.onrender.com/api/user-profile/edit',
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                Alert.alert('Success', 'Photo updated');
                setProfileView(false);
                fetchProfileData();
            } catch (err) {
                Alert.alert('Error', 'Upload failed');
            }
        });
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            navigation.replace('Login');
        } catch (err) {
            console.log('Logout error:', err);
        }
    };

    const handleProfileEdit = () => {
        navigation.navigate("Edit", {
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            email: userProfile.email,
            linkedin_url: userProfile.linkedin_url,
            attendees_role: userProfile.attendees_role,
            preference:
                Array.isArray(userProfile.preference)
                    ? userProfile.preference
                    : typeof userProfile.preference === 'string'
                        ? JSON.parse(userProfile.preference)
                        : [],
        });
    };

    const getProfileImageSource = () => {
        if (!userProfile.photo) return profile;
        return {
            uri: userProfile.photo.startsWith('data:image') || userProfile.photo.startsWith('http')
                ? userProfile.photo
                : `https://letsmeet-backend-47lv.onrender.com/${userProfile.photo}`
        };
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.profileHeader}>Profile</Text>
                    {isViewingOwnProfile && (
                        <TouchableOpacity style={styles.profileEdit} onPress={handleProfileEdit}>
                            <MaterialIcons name="edit" size={24} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.userName}>
                    <Text style={styles.userDetail}>{userProfile.first_name}</Text>
                    <Text style={styles.userDetail}>{userProfile.last_name}</Text>
                </View>
                <View style={styles.userRole}>
                    <Text style={styles.userDetail}>{userProfile.attendees_role}</Text>
                </View>
            </View>

            <TouchableOpacity onPress={() => setProfileView(true)}>
                <Image source={getProfileImageSource()} style={styles.profile} />
            </TouchableOpacity>

            <Modal visible={profileView} transparent animationType="fade">
                <BlurView
                    style={styles.blur}
                    blurType="light"
                    blurAmount={15}
                    reducedTransparencyFallbackColor="white"
                />
                <TouchableOpacity style={styles.modalOverlay} onPressOut={() => setProfileView(false)}>
                    <View style={styles.modalContent}>
                        <Image
                            source={getProfileImageSource()}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                        {isViewingOwnProfile && (
                            <TouchableOpacity style={styles.editIcon} onPress={handleEditPhoto}>
                                <MaterialIcons name="edit" size={24} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            <View style={styles.user}>
                <View style={styles.userDetails}>
                    <Text style={styles.data}>E-mail: </Text>
                    <Text style={styles.details}>{userProfile.email}</Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={styles.data}>LinkedIn: </Text>
                    {userProfile.linkedin_url ? (
                        <TouchableOpacity onPress={() => Linking.openURL(userProfile.linkedin_url)}>
                            <Text style={styles.linkText}>{userProfile.linkedin_url}</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.details}>N/A</Text>
                    )}
                </View>
                <View style={styles.userDetails}>
                    <Text style={styles.data}>Preferences: </Text>
                    <Text style={styles.details}>
                        {userProfile.preference?.length > 0 ? userProfile.preference.join(', ') : 'None'}
                    </Text>
                </View>

                {isViewingOwnProfile && (
                    <TouchableOpacity onPress={handleLogout}>
                        <Text style={styles.logout}>Logout</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8effc',
        position: 'relative',
    },
    profileEdit: {
        marginLeft: 240,
    },
    fullImage: {
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    editIcon: {
        position: 'absolute',
        bottom: 25,
        right: 25,
        backgroundColor: '#333',
        borderRadius: 20,
        padding: 6,
        elevation: 3,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    blur: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    modalContent: {
        backgroundColor: '#f7faff',
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    headerContainer: {
        backgroundColor: '#34495e',
        height: 318,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    userName: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: 80,
    },
    userDetail: {
        color: '#fff',
        textAlign: 'center',
        marginTop: 10,
        fontSize: 18,
    },
    userRole: {
        alignItems: 'center',
    },
    profile: {
        width: 150,
        height: 150,
        borderRadius: 75,
        position: 'absolute',
        top: -70,
        right: 130,
    },
    userDetails: {
        flexDirection: 'row',
        paddingLeft: 30,
        paddingTop: 20,
    },
    details: {
        color: '#333',
        fontSize: 15,
        width: 280,
    },
    data: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    logout: {
        width: 118,
        height: 40,
        backgroundColor: '#34495e',
        borderRadius: 10,
        color: 'white',
        textAlign: 'center',
        fontSize: 17,
        marginLeft: 155,
        marginTop: 50,
        paddingVertical: 5,
    },
    user: {
        top: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },
    linkText: {
        color: '#007BFF',
        textDecorationLine: 'underline',
        fontSize: 14,
        width: 280,
    },
    profileHeader: {
        color: 'white',
        fontSize: 25,
        margin: 15,
    },
});

export default UserProfile;
