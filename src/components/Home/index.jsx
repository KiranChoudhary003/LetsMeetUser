/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@react-native-community/blur';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator, Animated, Modal, Pressable,
    RefreshControl,
    SafeAreaView, ScrollView, StatusBar, StyleSheet,
    Text, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LocationContext } from '../LocationContext/LocationContext';
dayjs.extend(utc);
dayjs.extend(timezone);


const EventCard = ({
    id,
    name,
    organizer,
    date,
    onPress,
    isRegistered,
    checkInAvailable,
    already_checked_in,
    onRegister,
    onCheckIn,
}) => {
    const navigation = useNavigation();
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    };

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

                        {/* Organizer with location icon */}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="location-sharp" size={14} color="#34495e" style={{ marginRight: 4 }} />
                            <Text style={styles.eventOrganizer}>{organizer}</Text>
                        </View>

                        {/* Date with calendar icon */}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Fontisto name="date" size={14} color="#34495e" style={{ marginRight: 4 }} />
                            <Text style={styles.eventDate}>{formatDate(date)}</Text>
                        </View>
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
                            <View>
                                <View
                                    style={{
                                        backgroundColor: '#4CAF50',
                                        opacity: 0.6,
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderRadius: 20,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text disabled={true} style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                                        Checked-In
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        backgroundColor: '#34495e',
                                        marginTop: 4,
                                        paddingVertical: 4,
                                        paddingHorizontal: 8,
                                        borderRadius: 20,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Connection', { eventId: id })}
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                    >
                                        <Ionicons
                                            name="people-outline"
                                            size={14}
                                            color="#f9efef"
                                        />
                                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                                            Attendees
                                        </Text>
                                    </TouchableOpacity>
                                </View>
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
    const now = dayjs();

    const upcomingEvents = events.filter(event => {
        const eventEndDate = dayjs.utc(event.endDate).local();
        return eventEndDate.isAfter(now) || eventEndDate.isSame(now, 'day');
    });

    const grouped = upcomingEvents.reduce((acc, event) => {
        const eventDate = dayjs.utc(event.date).local();
        const year = eventDate.year();
        const monthNumber = eventDate.month();
        const monthName = eventDate.format('MMMM');

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

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        return yearA === yearB ? monthA - monthB : yearA - yearB;
    });

    const result = {};
    sortedKeys.forEach(key => {
        result[key] = grouped[key];
    });

    return result;
};


const formatDate = (date) => {
    if (!date) { return ''; }
    const parsedDate = dayjs(date).utc();
    return parsedDate.isValid() ? parsedDate.local().format('MM-DD-YYYY') : '';
};



const Home = ({ navigation }) => {
    const [eventData, setEventData] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [customDate, setCustomDate] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [previousFilter, setPreviousFilter] = useState(selectedFilter);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [hasDateBeenPicked, setHasDateBeenPicked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [checkInDistance, setCheckInDistance] = useState(null);
    const [AlertVisible, setAlertVisible] = useState(false);
    const [AlertMessage, setAlertMessage] = useState('');


    const formatDateToLocalYYYYMMDD = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useFocusEffect(
        React.useCallback(() => {
            // Case 1: First load
            if (eventData.length === 0) {
                fetchUpcomingEvents();
                return;
            }
        }, [eventData, fetchUpcomingEvents])
    );

    useEffect(() => {
        if (eventData.length > 0) {
            setFilteredEvents(filterEvents(eventData, selectedFilter, customDate, location));
        }
    }, [eventData, selectedFilter, customDate, location]);


    const filterEvents = (events, filterType, filterDate, location) => {
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        switch (filterType) {
            case 'All':
                return events;

            case 'Today':
                return events.filter(event =>
                    dayjs.utc(event.date).local().format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
                );

            case 'Tomorrow':
                return events.filter(event =>
                    dayjs.utc(event.date).local().format('YYYY-MM-DD') === dayjs().add(1, 'day').format('YYYY-MM-DD')
                );

            case 'Choose from Calendar':
                if (!filterDate) { return []; }
                return events.filter(event =>
                    dayjs.utc(event.date).local().format('YYYY-MM-DD') === dayjs(filterDate).format('YYYY-MM-DD')
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
                    return distance <= 5;
                });

            default:
                return events;
        }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const triggerEventAlert = (message) => {
        setAlertMessage(message);
        setAlertVisible(true);
    };



    const { location } = useContext(LocationContext);

    const handleRegister = async (eventId) => {
        try {
            const token = await AsyncStorage.getItem('token');

            if (!eventId) {
                return;
            }

            await axios.post(
                `${BASE_URL}/api/user-events/register-event`,
                { event_id: eventId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            triggerEventAlert(
                `You’ll be able to check in when you are within ${(checkInDistance).toFixed(2)} km of the event location on the scheduled day.`
            );
            fetchUpcomingEvents();
        } catch (error) {
            triggerEventAlert('Something went wrong during registration. Please try again.');
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
            triggerEventAlert(error.response?.data?.message || 'Something went wrong. Please try again.');
        }
    };

    const fetchUpcomingEvents = useCallback(async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');

            const response = await axios.post(
                `${BASE_URL}/api/user-events/upcoming-events`,
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
            const checkInDistance = response.data.check_in_distance;

            await AsyncStorage.setItem('check_in_distance', checkInDistance.toString());

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
                check_in_distance: checkInDistance / 1000,
            }));

            setCheckInDistance(checkInDistance / 1000);
            setEventData(formattedEvents);
            setFilteredEvents(filterEvents(formattedEvents, selectedFilter, customDate, location));
        } catch (error) {
        } finally {
            setLoading(false);
            if (isFirstLoad) { setIsFirstLoad(false); }
        }
    }, [location, selectedFilter, customDate]);

    useEffect(() => {
        if (location?.latitude && location?.longitude && eventData.length === 0) {
            fetchUpcomingEvents();
        }
    }, [location, eventData]);


    const events = useMemo(() => groupEventsByMonth(filteredEvents), [filteredEvents]);


    const handleFilterChange = (option) => {
        setPreviousFilter(selectedFilter);
        setSelectedFilter(option);

        if (option === 'Choose from Calendar') {
            setShowFilters(false);
            setShowDatePicker(true);
            setHasDateBeenPicked(false);
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
        <SafeAreaView style={styles.container}>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
            />
            <View style={styles.header}>
                <View style={styles.centerContainer}>
                    <View style={styles.eventsLabel}>
                        <Text style={styles.eventsLabelText}>Events for you</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setPreviousFilter(selectedFilter);
                            setShowFilters(!showFilters);
                        }}
                        style={styles.filterContainer}
                    >
                        <Text style={styles.filterButtonText}>Filter</Text>
                        <View style={styles.filterIcon}>
                            <Ionicons name="filter" size={16} color="#000" />
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.selectedFilterContainer}>
                    {selectedFilter !== 'All' ? (
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedFilter('All');
                                setCustomDate(new Date());
                                const filtered = filterEvents(eventData, 'All', null, location);
                                setFilteredEvents(filtered);
                            }}
                            style={styles.clearFilterButton}
                        >
                            <View style={styles.filterContent}>
                                <Text style={styles.selectedFilter}>
                                    {customDate && selectedFilter === 'Choose from Calendar'
                                        ? formatDate(customDate)
                                        : selectedFilter}
                                </Text>
                                <Ionicons name="close-circle" size={18} color="#34495e" style={styles.closeIcon} />
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ height: 23 }} />
                    )}
                </View>
            </View>
            <ScrollView contentContainerStyle={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={loading && !isFirstLoad && eventData.length > 0}
                        onRefresh={fetchUpcomingEvents}
                        colors={["#34495e"]}
                        tintColor="#34495e"
                    />
                }>
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
                                    {['All', 'Today', 'Tomorrow', 'Choose from Calendar', 'Near Me'].map((option) => (
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
                                        current={
                                            customDate
                                                ? formatDateToLocalYYYYMMDD(customDate)
                                                : formatDateToLocalYYYYMMDD(new Date())
                                        }
                                        markedDates={
                                            customDate
                                                ? {
                                                    [formatDateToLocalYYYYMMDD(customDate)]: {
                                                        selected: true,
                                                        selectedColor: '#7680de',
                                                        selectedTextColor: '#fff',
                                                    },
                                                }
                                                : {}
                                        }
                                        onDayPress={({ dateString }) => {
                                            const [year, month, day] = dateString.split('-');
                                            const pickedDate = new Date(year, month - 1, day);
                                            setCustomDate(pickedDate);
                                            setSelectedFilter('Choose from Calendar');
                                            const filtered = filterEvents(eventData, 'Choose from Calendar', pickedDate, location);
                                            setFilteredEvents(filtered);
                                            setHasDateBeenPicked(true);
                                            setShowDatePicker(false);
                                        }}
                                    />
                                </View>
                            </TouchableWithoutFeedback>
                        </TouchableOpacity>
                    </Modal>
                )}
                {loading && eventData.length === 0 ? (
                    <View style={{ marginTop: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#34495e" />
                        <Text style={{ marginTop: 10, color: '#34495e', fontWeight: '600' }}>Loading events...</Text>
                    </View>
                ) : (
                    <>
                        {Object.keys(events).length === 0 && (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 400 }}>
                                <Text style={{ color: '#555', fontSize: 16, textAlign: 'center' }}>
                                    No Events Available.
                                </Text>
                            </View>
                        )}
                        {Object.entries(events).map(([month, data]) => (
                            <View key={month} style={styles.monthSection}>
                                <Text style={styles.monthTitle}>{`${data.monthName} ${data.year}`}</Text>
                                {data.events.map((event) => (
                                    <EventCard
                                        key={event.id.toString()}
                                        id={event.id}
                                        name={event.name}
                                        organizer={event.organizer}
                                        date={event.date}
                                        lat={event.lat}
                                        lon={event.lon}
                                        isRegistered={event.is_registered}
                                        checkInAvailable={event.check_in_available}
                                        already_checked_in={event.already_checked_in}
                                        checkInDistance={event.check_in_distance}
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
                                                checkInDistance: event.check_in_distance,
                                                onRegisterSuccess: (eventId, latestCheckInAvailable) => {
                                                    setEventData((prev) =>
                                                        prev.map((item) =>
                                                            item.id === eventId
                                                                ? { ...item, is_registered: true, check_in_available: latestCheckInAvailable }
                                                                : item
                                                        )
                                                    );
                                                },
                                                onCheckInSuccess: (eventId) => {
                                                    setEventData((prev) =>
                                                        prev.map((item) =>
                                                            item.id === eventId ? { ...item, already_checked_in: true } : item
                                                        )
                                                    );
                                                },
                                            })
                                        }
                                    />
                                ))}
                            </View>
                        ))}
                    </>
                )}
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        resizeMode: 'cover',
        backgroundColor: '#e8effc',
    },
    scrollView: {
        padding: 16,
        paddingTop: 0,
    },
    header: {
        paddingTop: 16,
        paddingHorizontal: 16,
        position: 'relative',
        alignItems: 'center',
    },
    centerContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    eventsLabel: {
        paddingVertical: 6,
    },
    eventsLabelText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
    },
    filterContainer: {
        position: 'absolute',
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000',
    },
    filterIcon: {
        marginLeft: 6,
    },
    selectedFilterContainer: {
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        width: '100%',
    },
    selectedFilter: {
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
        backgroundColor: '#34495e',
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    clearFilterButton: {
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#e8effc',
        backgroundColor: '#e8effc',
        paddingHorizontal: 8,
    },
    filterContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeIcon: {
        marginLeft: 4,
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
    filterText: {
        fontSize: 14,
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
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
        width: '100%',
        minHeight: 90,
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

export default Home;
