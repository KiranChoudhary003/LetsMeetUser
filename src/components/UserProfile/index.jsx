import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@react-native-community/blur';
import messaging from '@react-native-firebase/messaging';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal as MessageModal,
    Dimensions,
    Image,
    Linking,
    Modal,
    PermissionsAndroid,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet, Text, TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import profile from '../../assets/profile.png';
const { width } = Dimensions.get('window');

const UserProfile = ({ navigation, route }) => {
    const [userProfile, setUserProfile] = useState({});
    const [profileView, setProfileView] = useState(false);
    const [loading, setloading] = useState('');
    const [logoutLoading, setLogoutLoading] = useState('');
    const [showImageOptions, setShowImageOptions] = useState(false);
    const passedUser = route?.params?.user;
    const isViewingOwnProfile = !passedUser;
    const isDarkMode = useColorScheme() === 'dark';
    const [uploading, setUploading] = useState(false);
    const [AlertVisible, setAlertVisible] = useState(false);
    const [AlertMessage, setAlertMessage] = useState('');


    const fetchProfileData = async () => {
        try {
            setloading(true);
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${BASE_URL}/api/user-profile`, {
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

    const triggerEventAlert = (message) => {
        setAlertMessage(message);
        setAlertVisible(true);
    };

    const requestGalleryPermission = async () => {
        if (Platform.OS === 'android') {
            const permissionType =
                Platform.Version >= 33
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

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'Camera Permission',
                    message: 'Allow access to camera',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    };


    const pickImage = async (fromCamera = false) => {
        setProfileView(false);
        setShowImageOptions(false);

        const hasPermission = fromCamera
            ? await requestCameraPermission()
            : await requestGalleryPermission();

        if (!hasPermission) {
            triggerEventAlert('Permission Denied\nCamera and gallery access is required to continue.');
            return;
        }

        try {
            const image = fromCamera
                ? await ImagePicker.openCamera({
                    cropping: true,
                    freeStyleCropEnabled: true,
                    compressImageQuality: 0.8,
                    mediaType: 'photo',
                    useFrontCamera: true,
                })
                : await ImagePicker.openPicker({
                    cropping: true,
                    freeStyleCropEnabled: true,
                    compressImageQuality: 0.8,
                    mediaType: 'photo',
                });

            if (!image?.path) return;

            setUploading(true);

            const formData = new FormData();
            formData.append('photo', {
                uri: image.path,
                type: image.mime,
                name: 'photo.jpg',
            });

            const token = await AsyncStorage.getItem('token');
            await axios.put(
                `${BASE_URL}/api/user-profile/edit`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            triggerEventAlert('Your profile has been updated successfully.');
            fetchProfileData();
        } catch (err) {
            if (err.code === 'E_PICKER_CANCELLED') {return;}
            triggerEventAlert('Unable to upload the file. Please retry.');
        } finally {
            setUploading(false);
            setShowImageOptions(false);
        }
    };




    const handleLogout = async () => {
        try {
            setLogoutLoading(true);

            const token = await AsyncStorage.getItem('token');

            await axios.put(
                `${BASE_URL}/api/user-profile/logout`,
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

    const handleQRCode = () => {
        navigation.navigate('QRCode');
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
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={styles.headerContainer}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <MaterialIcons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.profileHeader}>Profile</Text>
                            {isViewingOwnProfile ? (
                                <TouchableOpacity onPress={handleProfileEdit}>
                                    <MaterialIcons name="edit" size={24} color="#fff" />
                                </TouchableOpacity>
                            ) : (
                                <View style={{ width: 24 }} />
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

                            {uploading && (
                                <View style={styles.uploadOverlay}>
                                    <ActivityIndicator size="large" color="#fff" />
                                </View>
                            )}
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
                                    <TouchableOpacity style={styles.editIcon} onPress={() => setShowImageOptions(true)}>
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
                                <TouchableOpacity onPress={handleQRCode} style={styles.iconButton} activeOpacity={0.7}>
                                    <MaterialCommunityIcons name="qrcode-scan"
                                        size={24}
                                        color="#34495e"
                                    />
                                </TouchableOpacity>
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

                    <Modal
                        visible={showImageOptions}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowImageOptions(false)}
                    >
                        <TouchableOpacity
                            style={styles.modalOverlayBottom}
                            activeOpacity={1}
                            onPressOut={() => setShowImageOptions(false)}
                        >
                            <View
                                style={[
                                    styles.bottomModal,
                                    { backgroundColor: isDarkMode ? '#1c1c1e' : '#fff', shadowColor: isDarkMode ? '#000' : '#aaa' }
                                ]}
                            >
                                {/* Modal Header with Title + Close Icon */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 18, alignItems: 'center' }}>
                                    <Text
                                        style={[
                                            styles.modalTitle,
                                            { color: isDarkMode ? '#fff' : '#000', fontSize: 18 } // white in dark, black in light
                                        ]}
                                    >
                                        Choose Option
                                    </Text>

                                    <TouchableOpacity onPress={() => setShowImageOptions(false)}>
                                        <MaterialIcons
                                            name="close"
                                            size={28}
                                            color={isDarkMode ? '#fff' : '#000'} // white in dark, black in light
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Take Photo Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.optionButton,
                                        { backgroundColor: isDarkMode ? '#2c2c2e' : '#f0f4fa' }
                                    ]}
                                    onPress={() => pickImage(true)}
                                >
                                    <MaterialIcons
                                        name="photo-camera"
                                        size={24}
                                        color={isDarkMode ? '#fff' : '#000'} // white/black
                                        style={{ marginRight: 10 }}
                                    />
                                    <Text
                                        style={[
                                            styles.optionText,
                                            { color: isDarkMode ? '#fff' : '#000' } // white/black
                                        ]}
                                    >
                                        Take Photo
                                    </Text>
                                </TouchableOpacity>

                                {/* Choose from Gallery Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.optionButton,
                                        { backgroundColor: isDarkMode ? '#2c2c2e' : '#f0f4fa' }
                                    ]}
                                    onPress={() => pickImage(false)}
                                >
                                    <MaterialIcons
                                        name="photo-library"
                                        size={24}
                                        color={isDarkMode ? '#fff' : '#000'} // white/black
                                        style={{ marginRight: 10 }}
                                    />
                                    <Text
                                        style={[
                                            styles.optionText,
                                            { color: isDarkMode ? '#fff' : '#000' } // white/black
                                        ]}
                                    >
                                        Choose from Gallery
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                    <MessageModal
                        transparent
                        visible={AlertVisible}
                        animationType="fade"
                        onRequestClose={() => setAlertVisible(false)}
                    >
                        <TouchableOpacity
                            style={styles.overlayBox}
                            activeOpacity={1}
                            onPressOut={() => setAlertVisible(false)}
                        >
                            {/* Blur background */}
                            <BlurView
                                style={StyleSheet.absoluteFill}
                                blurType="light"                           // keep it light for premium subtlety
                                blurAmount={3}                            // stronger blur for soft glass effect
                                reducedTransparencyFallbackColor="rgba(255,255,255,0.1)"  // very subtle fallback
                            />

                            <View style={styles.containerBox}>
                                <Text style={styles.titleBox}>Message</Text>
                                <Text style={styles.messageBox}>{AlertMessage}</Text>
                                <TouchableOpacity
                                    onPress={() => setAlertVisible(false)}
                                    style={styles.buttonBox}
                                >
                                    <Text style={styles.buttonTextBox}>OK</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </MessageModal>
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
    uploadOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: (width * 0.4) / 2,
        backgroundColor: 'rgba(0,0,0,0.5)', // dark semi-transparent overlay
        justifyContent: 'center',
        alignItems: 'center',
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
        textAlign: 'center',
        flex: 1,
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
    modalOverlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end',
    },

    bottomModal: {
        paddingVertical: 22,
        paddingHorizontal: 20,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        alignItems: 'center',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 18,
        letterSpacing: 0.5,
    },

    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 15,
        width: '100%',
        marginBottom: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
    },

    optionText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },

    cancelButton: {
        paddingVertical: 14,
        borderRadius: 15,
        width: '100%',
        marginTop: 10,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
    },

    cancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
    overlayBox: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    containerBox: {
        backgroundColor: '#fff',
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderRadius: 16,
        minWidth: '60%',
        maxWidth: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    titleBox: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center',
        color: '#222',
    },
    messageBox: {
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
        color: '#555',
        lineHeight: 20,
    },
    buttonBox: {
        backgroundColor: '#34495E',
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
    },
    buttonTextBox: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        textAlign: 'center',
        letterSpacing: 0.4,
    },
});

export default UserProfile;
