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
    ToastAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const backgroundImage = require('../../assets/bgg.png');

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
        fetchUpcomingEvents,
    } = route.params;

    console.log('Route params:', route.params);

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

    const handlePress = async () => {
        if (isLoading) { return; }

        if (buttonState === 'checkin') {
            if (!checkInAvailable) {
                ToastAndroid.show('Check-in not available!', ToastAndroid.SHORT);
                return;
            }

            setIsLoading(true);
            try {
                await handleCheckIn(id);
                setButtonState('checkedin');
            } catch (error) {

            }
            setIsLoading(false);
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
                        <Text style={styles.backArrow}><Ionicons name="arrow-back-outline" size={30} color="#f9efef" /></Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{name}</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {banner ? (
                        <Image
                            source={{ uri: banner }} 
                            style={styles.poster}
                            resizeMode="cover"
                        />
                    ) : (null)
                    }
                    <View style={styles.locationLabel}>
                        <Ionicons name="location-outline" size={16} color="#000" />
                        <Text style={styles.locationText}> {organizer}</Text>
                    </View>

                    <Text style={styles.descriptionHeading}>Description</Text>
                    <Text style={styles.descriptionText}>{description}</Text>

                    {/* Attendance Banner */}

                    {buttonState === 'checkedin' ? (
                        <View style={styles.tickWrapper}>
                            <Text style={styles.tickText}>You have Attended the Event</Text>
                        </View>
                    ) : buttonState === 'missed' ? (
                        <View style={styles.tickWrapper}>
                            <Text style={[styles.tickText, { color: 'red' }]}>You didn't attend the event</Text>
                        </View>
                    ) : buttonState === 'checkin' ? (
                        <TouchableOpacity
                            style={[
                                styles.attendButton,
                                {
                                    backgroundColor: checkInAvailable ? '#4CAF50' : '#aaa',
                                    borderColor: '#000000',
                                },
                            ]}
                            onPress={handlePress}
                            disabled={!checkInAvailable || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text style={[styles.attendButtonText, { color: 'white' }]}>
                                    Check In
                                </Text>
                            )}
                        </TouchableOpacity>
                    ) : null}

                    {/* Stats Section */}
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
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8effc',
    },
    tickWrapper: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        marginTop: 10,
    },
    tickText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#4CAF50', 
    },
    background: {
        flex: 1,
        resizeMode: 'cover',
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
        color: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#34495e',
    },
    backArrow: {
        color: 'white',
        fontSize: 24,
        marginRight: 15,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    poster: {
        width: '100%',
        height: 400,
        borderRadius: 10,
        marginBottom: 20,
    },
    locationLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        fontSize: 16,
        color: '#000',
        marginLeft: 4,
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
    checkedInBanner: {
        backgroundColor: '#E6FFE6',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignSelf: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    checkedInBannerText: {
        color: '#2E7D32',
        fontWeight: 'bold',
        fontSize: 14,
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
        borderColor: '#3A5BFF', 
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

});

export default MyEventsDesciption;
