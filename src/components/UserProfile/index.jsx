import React, { useCallback, useEffect, useState } from 'react';
import {
    Image, Modal, StyleSheet, Text, TouchableOpacity, View, Alert, Linking,
    Platform, PermissionsAndroid, ScrollView, SafeAreaView, Dimensions,
    ActivityIndicator, StatusBar, useColorScheme
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import profile from '../../assets/profile.png';
import axios from 'axios';
import { BlurView } from '@react-native-community/blur';
import { launchImageLibrary } from 'react-native-image-picker';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import messaging from '@react-native-firebase/messaging';
const { width } = Dimensions.get('window');

const UserProfile = ({ navigation, route }) => {
    const [userProfile, setUserProfile] = useState({});
    const [profileView, setProfileView] = useState(false);
    const [loading, setloading] = useState('');
    const [logoutLoading, setLogoutLoading] = useState('');

    const passedUser = route?.params?.user;
    const isViewingOwnProfile = !passedUser;

    const fetchProfileData = async () => {
        try {
            setloading(true);
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get('https://letsmeet-backend-47lv.onrender.com/api/user-profile', {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const user = response.data.user;
            setUserProfile(user);

            if (user.photo) {
                const photoUri = user.photo.startsWith('data:image') || user.photo.startsWith('http')
                    ? user.photo
                    : `https://letsmeet-backend-47lv.onrender.com/${user.photo}`;
                await AsyncStorage.setItem('user_photo', photoUri);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setloading(false);
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
            if (!passedUser) { fetchProfileData(); }
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
            if (response.didCancel || response.errorCode) { return; }

            const asset = response.assets?.[0];
            if (!asset?.uri) { return; }

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
            setLogoutLoading(true);

            const token = await AsyncStorage.getItem('token');

            await axios.put(
                'https://letsmeet-backend-47lv.onrender.com/api/user-profile/logout',
                {},
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            ).catch(() => {
            });

            await messaging().deleteToken().catch(() => { });

            await AsyncStorage.multiRemove(['token', 'user_photo']);

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Welcome' }],
                })
            );
        } catch {
        } finally {
            setLogoutLoading(false);
        }
    };



    const handleProfileEdit = () => {
        navigation.navigate('Edit', {
            first_name: userProfile.first_name,
            middle_name: userProfile.middle_name,
            last_name: userProfile.last_name,
            email: userProfile.email,
            company_name: userProfile.company_name,
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
        if (!userProfile.photo) { return profile; }
        return {
            uri: userProfile.photo.startsWith('data:image') || userProfile.photo.startsWith('http')
                ? userProfile.photo
                : `https://letsmeet-backend-47lv.onrender.com/${userProfile.photo}`,
        };
    };

    return (
        <>
            <StatusBar barStyle={useColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
                            <Text style={styles.userDetail}>
                                {[userProfile.first_name, userProfile.middle_name, userProfile.last_name]
                                    .filter(Boolean)
                                    .join(" ")}
                            </Text>

                        </View>
                        <View style={styles.userRole}>
                            <Text style={styles.userDetail}>{userProfile.attendees_role}</Text>
                        </View>
                    </View>

                    <View style={styles.profileWrapper}>
                        <TouchableOpacity onPress={() => setProfileView(true)}>
                            <Image source={getProfileImageSource()} style={styles.profile} />
                        </TouchableOpacity>
                    </View>

                    <Modal visible={profileView} transparent animationType="fade">
                        <BlurView style={styles.blur} blurType="light" blurAmount={15} />
                        <FontAwesome name="close" size={28} color="#ffffff" style={styles.profileCloseIcon} onPress={() => setProfileView(false)} />
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
                    {isViewingOwnProfile && loading ? (
                        <View style={{ marginTop: 150, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#34495e" />
                            <Text style={{ marginTop: 10, color: '#34495e', fontWeight: '600' }}>Loading Profile...</Text>
                        </View>
                    ) : (
                        <View style={styles.user}>
                            <View style={styles.iconRow}>
                                {userProfile.email && (
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL(`mailto:${userProfile.email}`)}
                                        activeOpacity={0.7}
                                        style={styles.iconButton}
                                    >
                                        <MaterialIcons name="email" size={24} color="#34495e" />
                                    </TouchableOpacity>
                                )}

                                {userProfile.linkedin_url && (
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL(userProfile.linkedin_url)}
                                        activeOpacity={0.7}
                                        style={styles.iconButton}
                                    >
                                        <FontAwesome name="linkedin" size={24} color="#0A66C2" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.preferenceSection}>
                                <View style={styles.preferenceRow}>
                                    <Text style={styles.preferenceLabel}>Company Name: </Text>
                                    <Text style={styles.companyDetails}>
                                        {userProfile.company_name && userProfile.company_name.trim() !== ''
                                            ? userProfile.company_name
                                            : 'Not Provided'}
                                    </Text>
                                </View>

                                <View style={styles.preferenceRow}>
                                    <Text style={styles.preferenceLabel}>Preferences:</Text>

                                    {userProfile.preference?.length > 0 ? null : (
                                        <Text style={styles.noneText}>None</Text>
                                    )}
                                </View>

                                {userProfile.preference?.length > 0 && (
                                    <ScrollView
                                        style={styles.preferenceScroll}
                                        contentContainerStyle={styles.tagContainer}
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {userProfile.preference.map((item, index) => (
                                            <View key={index} style={styles.tag}>
                                                <Text style={styles.tagText}>{item}</Text>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>

                            {isViewingOwnProfile && (
                                logoutLoading ? (
                                    <ActivityIndicator size="large" color="#34495e" style={{ marginTop: 10 }} />
                                ) : (
                                    <TouchableOpacity onPress={handleLogout}>
                                        <Text style={styles.logout}>Logout</Text>
                                    </TouchableOpacity>
                                ))}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView >
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8effc',
    },
    profileWrapper: {
        alignItems: 'center',
        marginTop: -50,
    },
    profile: {
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: (width * 0.4) / 2,
        borderWidth: 3,
        borderColor: '#fff',
        backgroundColor: '#fff',
    },
    headerContainer: {
        backgroundColor: '#34495e',
        paddingBottom: 60,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 15,
    },
    profileHeader: {
        color: 'white',
        fontSize: 24,
        fontWeight: '600',
    },
    profileEdit: {
        padding: 4,
    },
    userName: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: 35,
        flexWrap: 'wrap',
    },
    userDetail: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '500',
    },
    companyDetails: {
        color: '#000',
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '500',
    },
    userRole: {
        alignItems: 'center',
        marginTop: 8,
    },
    user: {
        marginTop: 30,
        paddingHorizontal: 20,
    },
    data: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#222',
    },
    linkedinCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f4fa',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 15,
        gap: 10,
        elevation: 1,
    },
    linkedinText: {
        color: '#0A66C2',
        fontSize: 15,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        gap: 15,
    },
    infoText: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: '#555',
        fontWeight: '600',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 15,
        color: '#34495e',
    },
    linkedinValue: {
        fontSize: 15,
        color: '#0A66C2',
        textDecorationLine: 'underline',
        fontWeight: '500',
    },
    logout: {
        backgroundColor: '#34495e',
        borderRadius: 8,
        color: 'white',
        textAlign: 'center',
        fontSize: 17,
        paddingVertical: 10,
        marginTop: 30,
        alignSelf: 'center',
        width: 150,
    },
    fullImage: {
        width: 300,
        height: 300,
        borderRadius: 150,
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
    profileCloseIcon: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 10,
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
    editIcon: {
        position: 'absolute',
        bottom: 25,
        right: 25,
        backgroundColor: '#333',
        borderRadius: 20,
        padding: 6,
        elevation: 3,
    },
    iconRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 20,
    },

    iconButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },

    preferenceSection: {
        marginTop: 10,
    },

    preferenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 8,
    },

    preferenceLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#222',
    },

    noneText: {
        fontSize: 15,
        color: '#555',
        marginLeft: 6,
    },

    preferenceScroll: {
        maxHeight: 150,
    },

    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    tag: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },

    tagText: {
        color: '#1e3a8a',
        fontSize: 14,
        fontWeight: '500',
    },



});

export default UserProfile;
