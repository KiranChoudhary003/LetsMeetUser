import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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


    const [buttonState, setButtonState] = useState(() => {
        if (!isRegistered) { return 'register'; }
        if (already_checked_in) { return 'checkedin'; }
        return 'checkin';
    });

    const [isLoading, setIsLoading] = useState(false);

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
                Alert.alert(
                    'Check-In Unavailable',
                    `Check-in is not available at the moment.\nYou must be within ${checkInDistance} km range of the event location on the day of the event.`,
                    [{ text: 'OK' }]
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
            if (!eventId) return;

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

            Alert.alert(
                'Registration Successful',
                `Check-in will be enabled when you are within ${(checkInDistance).toFixed(2)} km of the event on the day of the event.`,
                [{ text: 'OK' }]
            );

            // ✅ Call correct callback
            route.params?.onRegisterSuccess?.(eventId, latestCheckInAvailable);

            navigation.goBack();
        } catch (error) {
            Alert.alert(
                'Registration Failed',
                'Something went wrong during registration. Please try again.',
                [{ text: 'OK' }]
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

            Alert.alert(
                'Check-In Successful',
                'You have successfully checked in to the event.',
                [{ text: 'OK' }]
            );

            // ✅ Call correct callback
            route.params?.onCheckInSuccess?.(eventId, route.params.checkInAvailable);

            navigation.goBack();
        } catch (error) {
            Alert.alert(
                'Check-In Failed',
                error.response?.data?.message || 'Something went wrong. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };


    return (
        <>
            <StatusBar barStyle={useColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back-outline" size={24} color="#f9efef" />
                    </TouchableOpacity>
                    <Text
                        style={styles.headerTitle}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {name.split(' ').slice(0, 4).join(' ') + (name.split(' ').length > 4 ? '...' : '')}
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

                    <View style={styles.locationLabel}>
                        <Ionicons name="location-outline" size={16} color="#000" />
                        <Text style={styles.locationText}> {organizer}</Text>
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
            </SafeAreaView>
        </>
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
});

export default Description;
