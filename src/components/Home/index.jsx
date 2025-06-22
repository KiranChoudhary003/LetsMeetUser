import React, { useRef, useState, useEffect, useContext } from 'react';
import { Easing, ToastAndroid, Modal, Image, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { Dimensions } from 'react-native';
import {
    ScrollView,
    Text,
    View,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Pressable,
} from 'react-native';
import { LocationContext } from '../LocationContext/LocationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';

const EventCard = ({
    name,
    organizer,
    date,
    onPress,
    lat,
    lon,
    isRegistered,
    checkInAvailable,
    already_checked_in, // ✅ NEW PROP
    onRegister,
    onCheckIn,
}) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    };

    const screenWidth = Dimensions.get('window').width;
    return (
        <>
            <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
                <Animated.View
                    style={[
                        styles.card,
                        {
                            transform: [{ scale }],
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        },
                    ]}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={styles.eventName}>{name}</Text>
                        <Text style={styles.eventOrganizer}>{organizer}</Text>
                        <Text style={styles.eventDate}>{new Date(date).toLocaleDateString()}</Text>
                    </View>

                    <View>
                        {!isRegistered ? (
                            <TouchableOpacity
                                onPress={onRegister}
                                style={{
                                    backgroundColor: 'transparent',
                                    borderWidth: 1,
                                    borderColor: 'rgba(157, 9, 11, 0.96 )',
                                    paddingHorizontal: 12,
                                    paddingVertical: 4,
                                    borderRadius: 20,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 12 }}>
                                    Register
                                </Text>
                            </TouchableOpacity>
                        ) : already_checked_in ? (
                            <View
                                style={{
                                    backgroundColor: '#4CAF50',
                                    paddingHorizontal: 12,
                                    paddingVertical: 4,
                                    borderRadius: 20,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                                    ✔ Checked-In
                                </Text>
                            </View>
                        ) : checkInAvailable ? (
                            <TouchableOpacity
                                onPress={onCheckIn}
                                style={{
                                    backgroundColor: 'rgba(16,192,72,0.96)',
                                    paddingHorizontal: 12,
                                    paddingVertical: 4,
                                    borderRadius: 20,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                                    Check-In
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <View
                                style={{
                                    backgroundColor: '#bbb',
                                    paddingHorizontal: 12,
                                    paddingVertical: 4,
                                    borderRadius: 20,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                                    Check-In
                                </Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </Pressable>
        </>
    );
};

const groupEventsByMonth = (events) => {
    const now = new Date();

    // Only keep upcoming events (today or later)
    const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.endDate); // change if needed
        return eventDate >= now;
    });

    const grouped = upcomingEvents.reduce((acc, event) => {
        const eventDate = new Date(event.date); // change if needed
        const year = eventDate.getFullYear();
        const monthNumber = eventDate.getMonth(); // 0 = Jan
        const monthName = eventDate.toLocaleString('default', { month: 'long' });

        const key = `${year}-${monthNumber}`;
        if (!acc[key]) {
            acc[key] = {
                monthName,
                year,
                monthNumber,
                events: [],
            };
        }

        acc[key].events.push(event);
        return acc;
    }, {});

    // Sort month keys
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        return yearA === yearB ? monthA - monthB : yearA - yearB;
    });

    // Build the final object in sorted order
    const result = {};
    sortedKeys.forEach(key => {
        result[key] = grouped[key];
    });

    return result;
};


const Home = ({ navigation }) => {

    const [eventData, setEventData] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState('Global');
    const [customDate, setCustomDate] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [previousFilter, setPreviousFilter] = useState(selectedFilter);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [hasDateBeenPicked, setHasDateBeenPicked] = useState(false);
    const [loading, setLoading] = useState(false);


    const formatDate = (date) => {
        if (!(date instanceof Date)) { return ''; }

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();

        return `${day}-${month}-${year}`; // e.g., 16-06-2025
    };

    const filterEvents = (events, filterType, customDate, location) => {
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        switch (filterType) {
            case 'Global':
                return events;

            case 'Today':
                return events.filter(event =>
                    new Date(event.date).toDateString() === today.toDateString()
                );

            case 'Tomorrow':
                return events.filter(event =>
                    new Date(event.date).toDateString() === tomorrow.toDateString()
                );

            case 'Choose from Calendar':
                if (!customDate) { return []; }
                return events.filter(event =>
                    new Date(event.date).toDateString() === customDate.toDateString()
                );

            case 'Near Me':
                if (!location?.latitude || !location?.longitude) { return []; }
                return events.filter(event => {
                    const distance = calculateDistance(
                        location.latitude,
                        location.longitude,
                        event.lat,
                        event.lon
                    );
                    return distance <= 5; // within 5km
                });

            default:
                return events;
        }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };


    const { location } = useContext(LocationContext);

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

    const fetchUpcomingEvents = async () => {
        try {
            setLoading(true); // Start loading
            const token = await AsyncStorage.getItem('token');
            if (!location?.latitude || !location?.longitude) {
                console.warn('Location not available yet');
                return;
            }

            const response = await axios.post(
                'https://letsmeet-backend-47lv.onrender.com/api/user-events/upcoming-events',
                {
                    latitude: location.latitude,
                    longitude: location.longitude,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const rawEvents = response.data.events;
            const formattedEvents = rawEvents.map(event => ({
                id: event.id,
                name: event.name,
                description: event.description,
                date: event.start_date_time,
                endDate: event.end_date_time,
                lat: parseFloat(event.latitude),
                lon: parseFloat(event.longitude),
                organizer: event.venue || 'Unknown',
                webUrl: event.web_page_url,
                banner: event.banner,
                is_registered: event.is_registered,
                check_in_available: event.check_in_available,
                already_checked_in: event.already_checked_in,
            }));

            setEventData(formattedEvents);
            setFilteredEvents(filterEvents(formattedEvents, selectedFilter, customDate, location));
        } catch (error) {
            console.error('Error fetching events:', error.message || error);
        } finally {
            setLoading(false); // Stop loading
        }
    };


    useEffect(() => {
        if (location?.latitude && location?.longitude) {
            fetchUpcomingEvents();
        }
    }, [location]);

    const handleQRCode = () => {
        navigation.navigate('QRCode');
    };

    const handleProfile = () => {
        navigation.navigate('UserProfile');
    };

    const events = groupEventsByMonth(filteredEvents);
    const animatedPosition = useRef(new Animated.Value(0)).current;

    const moveToLeft = () => {
        Animated.timing(animatedPosition, {

            toValue: -120, // move farther left
            duration: 500, // longer = smoother
            easing: Easing.out(Easing.exp), // smooth easing
            useNativeDriver: true,
        }).start();
    };

    const handleFilterChange = (option) => {
        setSelectedFilter(option);

        if (option === 'Choose from Calendar') {
            setCustomDate(null);
            setShowDatePicker(true);
            return;
        }

        const filtered = filterEvents(eventData, option, customDate, location);
        setFilteredEvents(filtered);
        setShowFilters(false);
    };

    useEffect(() => {
        if (customDate && selectedFilter === 'Choose from Calendar') {
            const filtered = filterEvents(eventData, 'Choose from Calendar', customDate, location);
            setFilteredEvents(filtered);
        }
    }, [customDate]);

    return (
        <View style={styles.background} resizeMode="cover">
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />

                <ScrollView contentContainerStyle={styles.scrollView}>
                    <View style={styles.header}>
                        <View style={styles.headerfilter}>
                            <View style={styles.eventsLabel}>
                                <Text style={styles.eventsLabelText}>Events for you</Text>
                            </View>
                            <View style={styles.selectedFilterContainer}>
                                {selectedFilter !== 'Global' ? (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedFilter('Global');
                                            setCustomDate(undefined);
                                        }}
                                        style={styles.clearFilterButton}
                                    >
                                        <Text style={styles.selectedFilter}>
                                            {customDate && selectedFilter === 'Choose from Calendar'
                                                ? `${formatDate(customDate)} ×`
                                                : `${selectedFilter} ×`}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={styles.selectedFilter}>Global</Text>
                                )}
                            </View>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => {
                                setPreviousFilter(selectedFilter);
                                setShowFilters(!showFilters);
                            }}>
                                <View style={styles.filterContainer}>
                                    <Text style={styles.filterButtonText}>Filter</Text>
                                    <View style={styles.filterIcon}>
                                        <Ionicons name="filter" size={16} color="#000" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {showFilters && (
                        <Modal
                            animationType="slide"
                            transparent
                            visible={showFilters}
                            onRequestClose={() => setShowFilters(false)}
                        >
                            <TouchableOpacity
                                style={styles.filterOptionsContainer}
                                activeOpacity={1}
                                onPressOut={() => setShowFilters(false)}
                            >
                                <TouchableWithoutFeedback>
                                    <View style={styles.filterOptions}>
                                        {['Global', 'Today', 'Tomorrow', 'Choose from Calendar', 'Near Me'].map((option) => (
                                            <TouchableOpacity
                                                key={option}
                                                style={[styles.filterOption, selectedFilter === option && styles.filterActive]}
                                                onPress={() => handleFilterChange(option)}
                                            >
                                                <Text style={styles.filterText}>{option}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </TouchableWithoutFeedback>
                            </TouchableOpacity>
                        </Modal>
                    )}
                    {showDatePicker && (
                        <Modal
                            animationType="fade"
                            transparent
                            visible={showDatePicker}
                            onRequestClose={() => {
                                setHasDateBeenPicked(false);
                                setShowDatePicker(false);
                            }}
                        >
                            <TouchableOpacity
                                style={styles.modalOverlay}
                                activeOpacity={1}
                                onPressOut={() => {
                                    if (!hasDateBeenPicked) {
                                        setCustomDate(undefined);
                                        setSelectedFilter(previousFilter);
                                    }
                                    setHasDateBeenPicked(false);
                                    setShowDatePicker(false);
                                }}
                            >
                                <TouchableWithoutFeedback>
                                    <View style={styles.modalContainer}>
                                        <TouchableOpacity
                                            style={styles.closeButton}
                                            onPress={() => {
                                                setShowDatePicker(false);
                                                setHasDateBeenPicked(false);
                                                setSelectedFilter(previousFilter);
                                            }}
                                        >
                                            <Text style={styles.closeButtonText}>×</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.modalTitle}>Select a Date</Text>
                                        <Calendar
                                            current={customDate ? customDate.toISOString().split('T')[0] : undefined}
                                            onDayPress={({ dateString }) => {
                                                const [year, month, day] = dateString.split('-');
                                                const pickedDate = new Date(year, month - 1, day);
                                                setCustomDate(pickedDate);
                                                setSelectedFilter('Choose from Calendar');
                                                setHasDateBeenPicked(true);
                                                setShowDatePicker(false);
                                            }}
                                            theme={{
                                                todayTextColor: '#fff',
                                                todayBackgroundColor: 'rgba(118, 128, 222, 1)',
                                            }}
                                        />
                                    </View>
                                </TouchableWithoutFeedback>
                            </TouchableOpacity>
                        </Modal>
                    )}

                    {loading ? (
                        <View style={{ marginTop: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#34495e" />
                            <Text style={{ marginTop: 10, color: '#34495e', fontWeight: '600' }}>Loading events...</Text>
                        </View>
                    ) : (
                        Object.entries(events).map(([month, data]) => (
                            <View key={month} style={styles.monthSection}>
                                <Text style={styles.monthTitle}>{`${data.monthName} ${data.year}`}</Text>
                                {data.events.map((event) => (
                                    <EventCard
                                        key={event.id.toString()}
                                        name={event.name}
                                        organizer={event.organizer}
                                        date={event.date}
                                        lat={event.lat}
                                        lon={event.lon}
                                        isRegistered={event.is_registered}
                                        checkInAvailable={event.check_in_available}
                                        already_checked_in={event.already_checked_in}
                                        onRegister={() => handleRegister(event.id)}
                                        onCheckIn={() => handleCheckIn(event.id)}
                                        onPress={() =>
                                            navigation.navigate('Description', {
                                                id: event.id,
                                                name: event.name,
                                                organizer: event.organizer,
                                                description: event.description,
                                                date: event.date,
                                                endDate: event.endDate,
                                                lat: event.lat,
                                                lon: event.lon,
                                                webUrl: event.webUrl,
                                                banner: event.banner,
                                                isRegistered: event.is_registered,
                                                checkInAvailable: event.check_in_available,
                                                already_checked_in: event.already_checked_in,
                                                fetchUpcomingEvents,
                                            })
                                        }
                                    />
                                ))}
                            </View>
                        ))
                    )}

                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    selectedFilter: {
        fontSize: 14,
        fontWeight: '500',
        color: '#34495e',
        backgroundColor: '#e8effc',
    },

    filterContainer: {
        flexDirection: 'row',
        marginTop: -20,
    },
    selectedFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 85,
    },
    filterIcon: {
        marginHorizontal: 4,
    },
    filterImage: { tintColor: '#000' },
    filterButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000',
    },
    headerfilter: {
        display: 'flex',
        alignItems: 'center',
    },

    filterOptionsContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        top: 120,
    },
    filterOptions: {
        backgroundColor: '#34495E',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        elevation: 50,
    },
    filterOption: {
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderRadius: 10,
    },
    filterActive: {
        backgroundColor: 'rgba(255,255,255,.29)',
    },
    filterText: { fontSize: 14, color: '#fff' },

    clearFilterButton: {
        marginTop: 2,
        padding: 3,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#e8effc',
    },
    background: {
        flex: 1,
        resizeMode: 'cover',
        backgroundColor: '#e8effc',
    },
    scrollView: {
        padding: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        position: 'relative',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 20,
        width: '80%',
        maxHeight: '80%',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        backgroundColor: 'transparent',
        padding: 4,
    },
    closeButtonText: {
        fontSize: 24,
        color: 'red',
        fontWeight: 'bold',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    letsMeet: {
        color: '#4E5FF9',
        fontSize: 20,
    },
    modalSubText: {
        fontSize: 15,
        color: '#555',
        marginTop: 10,
        textAlign: 'center',
        borderTopWidth: 0.8,
        borderTopColor: '#ccc',
    },

    modalText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    customHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#34495e',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },

    headerRight: {
        flexDirection: 'row',
        gap: 20,
    },

    profile: {
        width: 35,
        height: 35,
    },
    headerstyle: {
        width: 45,
        height: 45,
    },
    eventsLabel: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        width: 156,
        height: 41,
        marginLeft: 85,
        borderWidth: 1,
        borderColor: '#888',
        borderRadius: 20,
        backgroundColor: '#34495e',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    eventsLabelText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    button: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    filledButton: {
        backgroundColor: '#4F46E5S',
    },
    ghostButton: {
        backgroundColor: 'transparent',
    },
    buttonText: {
        fontSize: 14,
    },
    filledText: {
        color: '#fff',
    },
    ghostText: {
        color: '#000',
    },
    monthSection: {
        marginBottom: 24,
    },
    monthTitle: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    card: {
        width: '100%',       // ✅ Full width of parent
        minHeight: 90,       // ✅ Use minHeight instead of fixed height
        marginVertical: 6,
        borderBottomWidth: 0.5,
    },

    eventName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#111',
    },
    eventOrganizer: {
        fontSize: 12,
        color: '#555',
        marginBottom: 4,
    },
    eventDate: {
        fontSize: 12,

        color: '#555',
        alignSelf: 'flex-start',
        marginTop: 3,
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: '#34495e',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
        // borderTopLeftRadius: 20,
        // borderTopRightRadius: 20,
        overflow: 'visible',
    },

    centerCircle: {
        position: 'absolute',
        top: -25,
        left: '50%',
        right: '100%',
        marginLeft: -3, // half of width to center properly
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#465E5D',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },

    bottomIcon: {
        fontSize: 24,

        color: 'white',
    },
    bottomIconleft:
    {
        fontSize: 24,
        left: -20,
        color: 'white',
    },
    bottomIconright:
    {
        fontSize: 24,
        right: -25,
        color: 'white',
    },
    checkInNote: {
        fontSize: 10,
        color: '#333',
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // Semi-transparent white
        padding: 10,
        borderRadius: 10,
        marginVertical: 10,
        marginHorizontal: 6,
        textAlign: 'center',
        fontWeight: '500',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginLeft: -320,
        marginBottom: -50,
        elevation: 3, // Android shadow
    },
});

export default Home;
