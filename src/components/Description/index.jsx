import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useState } from 'react';
import { BlurView } from '@react-native-community/blur';
import {
    ActivityIndicator,
    Modal,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';


const Description = ({ navigation, route }) => {
    const {
        id,
        name,
        organizer,
        description,
        date,
        endDate,
        banner,
        isRegistered,
        checkInAvailable,
        already_checked_in,
        checkInDistance,
        lat,
        lon,
    } = route.params;
    const [AlertVisible, setAlertVisible] = useState(false);
    const [AlertMessage, setAlertMessage] = useState('');


    const [buttonState, setButtonState] = useState(() => {
        if (!isRegistered) { return 'register'; }
        if (already_checked_in) { return 'checkedin'; }
        return 'checkin';
    });

    const [isLoading, setIsLoading] = useState(false);

    const triggerEventAlert = (message) => {
        setAlertMessage(message);
        setAlertVisible(true);
    };

    const handlePress = async () => {
        if (isLoading) { return; }

        if (buttonState === 'register') {
            if (!id) {
                return;
            }

            setIsLoading(true);
            try {
                await handleRegister(id);
                setButtonState('checkin');
            } catch (error) { }
            setIsLoading(false);
        } else if (buttonState === 'checkin') {
            if (!checkInAvailable) {
                triggerEventAlert(
                    `Check-in is temporarily disabled.\nYou’ll be able to check in once you are within ${(checkInDistance).toFixed(2)} km of the event location on the scheduled day.`
                );
                return;
            }
            setIsLoading(true);
            try {
                await handleCheckIn(id);
                setButtonState('checkedin');
            } catch (error) { }
            setIsLoading(false);
        }
    };

    const handleRegister = async (eventId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!eventId) { return; }

            const res = await axios.post(
                `${BASE_URL}/api/user-events/register-event`,
                { event_id: eventId, latitude: lat, longitude: lon },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const latestCheckInAvailable = res.data.check_in_available;

            triggerEventAlert(
                `You’ll be able to check in when you are within  ${(checkInDistance).toFixed(2)} km of the event location on the scheduled day.`
            );

            route.params?.onRegisterSuccess?.(eventId, latestCheckInAvailable);

        } catch (error) {
            triggerEventAlert(
                'Something went wrong during registration. Please try again.'
            );
        }
    };


    const handleCheckIn = async (eventId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(
                `${BASE_URL}/api/user-events/check-in`,
                { event_id: eventId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            triggerEventAlert(
                'You have successfully checked in to the event.'
            );

            // ✅ Call correct callback
            route.params?.onCheckInSuccess?.(eventId, route.params.checkInAvailable);
        } catch (error) {
            triggerEventAlert(
                error.response?.data?.message || 'Something went wrong. Please try again.'
            );
        }
    };


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#34495e', paddingTop: StatusBar.currentHeight }}>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
            />
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back-outline" size={24} color="#f9efef" />
                    </TouchableOpacity>
                    <Text
                        style={styles.headerTitle}
                    >Event Details
                    </Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {banner && (
                        <Image
                            source={{ uri: banner }}
                            style={styles.poster}
                            resizeMode="cover"
                        />
                    )}
                    <View>
                        <Text style={styles.descriptionHeading}>Event Name</Text>
                        <View style={styles.event}>
                            <Text style={styles.eventName}> {name}</Text>
                        </View>
                    </View>

                    <View>
                        <Text style={styles.descriptionHeading}>Location</Text>
                        <View style={styles.locationLabel}>
                            <Ionicons name="location-outline" size={16} color="#000" />
                            <Text style={styles.locationText}> {organizer}</Text>
                        </View>
                    </View>

                    <Text style={styles.descriptionHeading}>Start Date</Text>
                    <Text style={styles.descriptionText}>
                        {new Date(date).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        })}
                    </Text>

                    <Text style={styles.descriptionHeading}>End Date</Text>
                    <Text style={styles.descriptionText}>
                        {new Date(endDate).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        })}
                    </Text>

                    <Text style={styles.descriptionHeading}>Description</Text>
                    <Text style={styles.descriptionText}>{description}</Text>

                    <TouchableOpacity
                        style={[
                            styles.attendButton,
                            {
                                backgroundColor:
                                    buttonState === 'checkedin'
                                        ? 'transparent'
                                        : buttonState === 'checkin'
                                            ? checkInAvailable
                                                ? '#4CAF50'
                                                : 'grey'
                                            : 'white',
                                borderColor:
                                    buttonState === 'checkedin' ? 'transparent' : '#000000',
                            },
                        ]}
                        onPress={handlePress}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#34495e" />
                        ) : buttonState === 'checkedin' ? (
                            <View style={styles.tickWrapper}>
                                <Text style={styles.tickText}>You have Attended the Event</Text>
                            </View>
                        ) : (
                            <Text
                                style={[
                                    styles.attendButtonText,
                                    {
                                        color:
                                            buttonState === 'checkin' && !checkInAvailable
                                                ? 'white'
                                                : buttonState === 'checkin'
                                                    ? 'white'
                                                    : 'black',
                                    },
                                ]}
                            >
                                {buttonState === 'register'
                                    ? 'Register'
                                    : buttonState === 'checkin'
                                        ? 'Check-In'
                                        : ''}
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
                <Modal
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
                                onPress={() => {
                                    setAlertVisible(false);
                                    navigation.goBack();
                                }}
                                style={styles.buttonBox}
                            >
                                <Text style={styles.buttonTextBox}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e9effc',
    },
    header: {
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 15,
        backgroundColor: '#34495e',
        position: 'relative',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    backArrow: {
        position: 'absolute',
        left: 15,
    },
    scrollContainer: {
        padding: 16,
    },
    poster: {
        width: '100%',
        height: 300,
        borderRadius: 10,
        marginBottom: 20,
    },
    locationLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginLeft: 4,
    },
    event: {
        marginBottom: 16,
    },
    eventName: {
        fontSize: 16,
        color: '#000',
    },
    locationText: {
        fontSize: 16,
        color: '#000',
    },
    descriptionHeading: {
        fontWeight: 'bold',
        fontSize: 20,
        marginBottom: 8,
        color: '#333',
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#333',
        marginBottom: 20,
    },
    attendButton: {
        alignSelf: 'center',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    attendButtonText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    tickWrapper: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        marginTop: 10,
        width: 300,
    },
    tickText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#4CAF50',
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

export default Description;
