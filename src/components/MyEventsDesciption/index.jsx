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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


const MyEventsDesciption = ({ navigation, route }) => {
    const {
        id,
        name,
        organizer,
        description,
        start_date,
        end_date,
        lat,
        lon,
        webUrl,
        banner,
        isRegistered,
        checkInAvailable,
        already_checked_in,
        totalConnections,
        approvedRequests,
        pendingRequests,
        checkInDistance,
        fetchUpcomingEvents,
    } = route.params;

    const [buttonState, setButtonState] = useState(() => {
        if (already_checked_in) {
            return 'checkedin';
        }

        const eventEndDate = new Date(end_date);
        const now = new Date();

        if (eventEndDate < now) {
            return 'missed';
        }

        return 'checkin';
    });

    const [isLoading, setIsLoading] = useState(false);
    const [AlertVisible, setAlertVisible] = useState(false);
    const [AlertMessage, setAlertMessage] = useState('');


    const handlePress = async () => {
        if (isLoading) { return; }

        if (buttonState === 'register') {
            if (!id) {
                return;
            }

            setIsLoading(true);
            try {
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
            triggerEventAlert('You have successfully checked in to the event.');
            fetchUpcomingEvents();
        } catch (error) {
            triggerEventAlert(
                error.response?.data?.message || 'Something went wrong. Please try again.'
            );
        }
    };

    const triggerEventAlert = (message) => {
        setAlertMessage(message);
        setAlertVisible(true);
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
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {
                            (name.length > 40
                                ? name.slice(0, 25) + '...'
                                : name.split(' ').slice(0, 4).join(' ') +
                                (name.split(' ').length > 4 ? '...' : '')
                            )
                        }
                    </Text>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('UserMeetings', { event: { id } })}
                        style={styles.iconWrapper}
                    >
                        <MaterialCommunityIcons
                            name="card-account-details"
                            size={26}
                            color="#fff"
                        />
                    </TouchableOpacity>
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
                        {new Date(start_date).toLocaleString('en-GB', {
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
                        {new Date(end_date).toLocaleString('en-GB', {
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
                                                : '#aaa'
                                            : '#e8effc',
                                borderColor:
                                    buttonState === 'checkedin' || buttonState === 'missed'
                                        ? 'transparent'
                                        : '#000000',
                            },
                        ]}
                        onPress={handlePress}
                        disabled={isLoading || buttonState !== 'checkin'}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#34495e" />
                        ) : buttonState === 'checkedin' ? (
                            <View style={styles.tickWrapper}>
                                <Text style={styles.tickText}>You have Attended the Event</Text>
                            </View>
                        ) : buttonState === 'missed' ? (
                            <View style={styles.tickWrapper}>
                                <Text style={[styles.tickText, { color: 'red' }]}>
                                    You didn't attend the event
                                </Text>
                            </View>
                        ) : (
                            <Text style={[styles.attendButtonText, { color: 'white' }]}>
                                Check In
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Total connection made</Text>
                            <Text style={styles.statNumber}>{totalConnections || 0}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Requested</Text>
                            <Text style={styles.statNumber}>{pendingRequests || 0}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Accepted</Text>
                            <Text style={styles.statNumber}>{approvedRequests || 0}</Text>
                        </View  >
                    </View>
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
                                onPress={() => setAlertVisible(false)}
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

export default MyEventsDesciption;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8effc',
    },
    header: {
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#34495e',
        position: 'relative',
    },
    backArrow: {
        position: 'absolute',
        left: 15,
    },
    iconWrapper: {
        position: 'absolute',
        right: 15,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginLeft: 30,
        marginRight: 30,
    },
    scrollContainer: {
        padding: 16,
        paddingBottom: 40,
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
    tickWrapper: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        borderColor: '#000',
        borderWidth: 0.2,
        marginTop: 10,
        width: 300,
    },
    tickText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#4CAF50',
    },
    attendButton: {
        alignSelf: 'center',
        paddingHorizontal: 100,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    attendButtonText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
        paddingHorizontal: 5,
    },
    statBox: {
        flex: 1,
        marginHorizontal: 5,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderWidth: 1.5,
        borderColor: '#34495e',
        borderRadius: 12,
        backgroundColor: 'transparent',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000',
        textAlign: 'center',
        marginBottom: 4,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
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
