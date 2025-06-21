import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ImageBackground,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    ToastAndroid,
} from 'react-native';

const backgroundImage = require('../../assets/bgg.png');

const Description = ({ navigation, route }) => {
    const {
        id,
        name,
        organizer,
        description,
        date,
        endDate,
        lat,
        lon,
        webUrl,
        banner,
        isRegistered,
        checkInAvailable,
        already_checked_in,
        fetchUpcomingEvents,
    } = route.params;

    console.log('Route params:', route.params);

    const [buttonState, setButtonState] = useState(() => {
        if (!isRegistered) {return 'register';}
        if (already_checked_in) {return 'checkedin';}
        return 'checkin';
    });
    // const [isInRange, setIsInRange] = useState(false); // false = out of range, true = within 500m
    const [isLoading, setIsLoading] = useState(false); // Loading spinner state

    // // Simulate entering range (static for demo)
    // React.useEffect(() => {
    //     const timer = setTimeout(() => setIsInRange(true), 2000);  // Auto "enter range" after 2 sec
    //     return () => clearTimeout(timer);
    // }, []);

    const handlePress = async () => {
        if (isLoading) {return;}

        if (buttonState === 'register') {
            if (!id) {
                console.warn('Missing event ID!');
                return;
            }

            setIsLoading(true);
            try {
                await handleRegister(id);
                setButtonState('checkin');
                // ToastAndroid.show("Registered successfully!", ToastAndroid.SHORT);
            } catch (error) {
                // handleRegister already shows toast
            }
            setIsLoading(false);
        } else if (buttonState === 'checkin') {
            if (!checkInAvailable) {
                ToastAndroid.show('Check-in not available!', ToastAndroid.SHORT);
                return;
            }

            setIsLoading(true);
            try {
                await handleCheckIn(id);
                setButtonState('checkedin');
                // ToastAndroid.show("You are successfully checked in", ToastAndroid.SHORT);
            } catch (error) {
                // handleCheckIn already shows toast
            }
            setIsLoading(false);
        }
    };

    const handleRegister = async (eventId) => {
        try {
            const token = await AsyncStorage.getItem('token');

            if (!eventId) {
                console.warn('Event ID is missing!');
                return;
            }

            console.log('Registering for event ID:', eventId); // ✅ debug

            await axios.post(
                'https://letsmeet-backend-47lv.onrender.com/api/user-events/register-event',
                { event_id: eventId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            ToastAndroid.show('Registered Successfully!', ToastAndroid.SHORT);
            fetchUpcomingEvents();
        } catch (error) {
            console.error('Registration error:', error.response?.data || error.message);
            ToastAndroid.show('Registration failed!', ToastAndroid.SHORT);
        }
    };

    const handleCheckIn = async (eventId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(
                'https://letsmeet-backend-47lv.onrender.com/api/user-events/check-in',
                { event_id: eventId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            ToastAndroid.show('Checked-In Successfully!', ToastAndroid.SHORT);

            // Optionally refetch events to update UI
            fetchUpcomingEvents();
        } catch (error) {
            console.error('Check-in error:', error.response?.data || error.message || error);
            ToastAndroid.show(error.response?.data?.message || 'Check-In failed!', ToastAndroid.SHORT);
        }
    };

    return (
        <View style={styles.background}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}> {name}</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Image
                        source={{ uri: banner }} // banner is the full base64 data URI
                        style={styles.poster}
                        resizeMode="cover"
                    />

                    <Text style={styles.locationLabel}>📍 {organizer}</Text>

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
                                borderColor: buttonState === 'checkedin' ? 'transparent' : '#000000',
                            },
                        ]}
                        onPress={handlePress}
                        disabled={
                            isLoading ||
                            (buttonState === 'checkin' && !checkInAvailable)
                        }
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#0000ff" />
                        ) : buttonState === 'checkedin' ? (
                            <View style={styles.tickWrapper}>
                                <Text style={styles.tickText}>✔ Checked In</Text>
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
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e9effc',
    },
    background: {
        flex: 1,
        resizeMode: 'cover',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#34495e',
    },
    backArrow: { color: 'white', fontSize: 24, marginRight: 15 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    scrollContainer: { padding: 16 },
    poster: { width: '100%', height: 400, borderRadius: 10, marginBottom: 20 },
    locationLabel: { fontSize: 16, marginBottom: 10, color: '#000000' },
    descriptionHeading: { fontWeight: 'bold', fontSize: 20, marginBottom: 8, color: '#333' },
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
        color: '#000000',
    },
    tickWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 5,
    },
    tickText: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },

});

export default Description;
