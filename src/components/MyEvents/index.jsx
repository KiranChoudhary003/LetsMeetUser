/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated,
  Pressable,
  RefreshControl,
  SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LocationContext } from '../LocationContext/LocationContext';
dayjs.extend(utc);
dayjs.extend(timezone);


const EventCard = ({
  id,
  name,
  organizer,
  start_date,
  end_date,
  lat,
  lon,
  already_checked_in,
  userLat,
  userLon,
  onCheckIn,
  onPress,
  checkInDistance,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const [withinRange, setWithinRange] = useState(false);
  const [isFutureEvent, setIsFutureEvent] = useState(true);


  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkProximityAndDate = () => {
    const eventDate = new Date(end_date);
    const today = new Date();
    setIsFutureEvent(eventDate > today);

    if (
      userLat != null &&
      userLon != null &&
      lat != null &&
      lon != null &&
      checkInDistance != null
    ) {
      const distance = calculateDistance(userLat, userLon, lat, lon);
      setWithinRange(distance <= checkInDistance);
    } else {
      setWithinRange(false);
    }
  };


  const formatDate = (date) => {
    if (!date) { return ''; }
    const parsedDate = dayjs(date).utc();
    return parsedDate.isValid() ? parsedDate.local().format('MM-DD-YYYY') : '';
  };



  useEffect(() => {
    checkProximityAndDate();
  }, [userLat, userLon, lat, lon, end_date, checkInDistance]);


  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
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
            <Text style={styles.eventDate}>{formatDate(start_date)}</Text>
          </View>
        </View>

        <View>
          {already_checked_in ? (
            <View style={{
              backgroundColor: '#4CAF50',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Checked In</Text>
            </View>
          ) : isFutureEvent ? (
            <TouchableOpacity
              onPress={() => {
                if (withinRange) {
                  onCheckIn();
                } else {
                  Alert.alert(
                    'Check-In Unavailable',
                    `Check-in is not available at the moment.\nYou must be within ${checkInDistance} km range of the event location on the day of the event.`,
                    [{ text: 'OK' }]
                  );
                }
              }}
              style={{
                backgroundColor: withinRange ? '#4CAF50' : '#bbb',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Check-In</Text>
            </TouchableOpacity>
          ) : (
            <View style={{
              backgroundColor: '#e74c3c',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Not Checked In</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const groupEventsByMonth = (events) => {
  const grouped = events.reduce((acc, event) => {
    const eventDate = new Date(event.start_date);
    const year = eventDate.getFullYear();
    const monthNumber = eventDate.getMonth();
    const monthName = eventDate.toLocaleString('default', { month: 'long' });
    const key = `${year}-${monthNumber}`;

    if (!acc[key]) {
      acc[key] = {
        monthName,
        year,
        events: [],
        monthNumber,
      };
    }
    acc[key].events.push(event);
    return acc;
  }, {});

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;


  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    if (yearA === yearB) { return monthB - monthA; }
    return yearB - yearA;
  });

  const result = {};
  if (grouped[currentMonthKey]) {
    result[currentMonthKey] = grouped[currentMonthKey];
  }

  sortedKeys.forEach((key) => {
    if (key !== currentMonthKey) {
      result[key] = grouped[key];
    }
  });

  return result;
};

const EventsScreen = ({ navigation }) => {

  const [eventData, setEventData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { location } = useContext(LocationContext);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const events = groupEventsByMonth(eventData);

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
      fetchUpcomingEvents();
    } catch (error) {
      Alert.alert(
        'Check-In Failed',
        error.response?.data?.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const fetchUpcomingEvents = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${BASE_URL}/api/user-events/registered-events`,
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
      let checkInDistance = response.data.check_in_distance;
      if (checkInDistance == null) {
        const storedDistance = await AsyncStorage.getItem('check_in_distance');
        if (storedDistance) {
          checkInDistance = parseFloat(storedDistance);
        }
      } else {
        await AsyncStorage.setItem('check_in_distance', checkInDistance.toString());
      }
      const rawEvents = response.data.events;
      const formattedEvents = rawEvents.map(event => ({
        id: event.id,
        name: event.name,
        organizer: event.venue || 'Unknown',
        webUrl: event.web_page_url,
        banner: event.banner,
        description: event.description,
        check_in_available: event.check_in_available,
        start_date: event.start_date_time,
        end_date: event.end_date_time,
        lat: parseFloat(event.latitude),
        lon: parseFloat(event.longitude),
        isRegistered: event.is_registered,
        totalConnections: event.total_connections,
        approvedRequests: event.approved_requests,
        pendingRequests: event.pending_requests,
        already_checked_in: event.already_checked_in,
        check_in_distance: checkInDistance / 1000,
      }));

      setEventData(formattedEvents);
      await AsyncStorage.setItem('eventsData', JSON.stringify(formattedEvents));
    } catch (error) {
      console.error('🚨 fetchUpcomingEvents error:', error);
    } finally {
      setLoading(false);
      if (isFirstLoad) setIsFirstLoad(false);
    }
  };


  useEffect(() => {
    const loadData = async () => {
      try {
        const cached = await AsyncStorage.getItem('eventsData');
        if (cached) {
          const data = JSON.parse(cached);
          setEventData(data);
          setLoading(false);
        }

        fetchUpcomingEvents();
      } catch (error) {
        fetchUpcomingEvents();
      }
    };

    loadData();
  }, []);

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={
            useColorScheme() === "dark" ? "light-content" : "dark-content"
          }
        />
        <View style={styles.header}>
          <View style={styles.centerContainer}>
            <View style={styles.eventsLabel}>
              <Text style={styles.eventsLabelText}>My Events</Text>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={loading && !isFirstLoad && eventData.length > 0}
              onRefresh={fetchUpcomingEvents}
              colors={["#34495e"]}
              tintColor="#34495e"
            />
          }
        >
          {loading && eventData.length === 0 ? (
            <View
              style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            >
              <Text
                style={{ marginBottom: 10, fontSize: 16, color: "#555" }}
              >
                Loading your events...
              </Text>
              <ActivityIndicator size="large" color="#34495e" />
            </View>
          ) : eventData.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#2c3e50",
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                No Events Found
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#7f8c8d",
                  textAlign: "center",
                  marginTop: 6,
                }}
              >
                You haven't registered or attended any events yet.
              </Text>
            </View>
          ) : (
            Object.entries(events).map(([month, data]) => (
              <View key={month} style={styles.monthSection}>
                <Text style={styles.monthTitle}>
                  {`${data.monthName} ${data.year}`}
                </Text>

                {data.events.map((event) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    name={event.name}
                    organizer={event.organizer}
                    start_date={event.start_date}
                    end_date={event.end_date}
                    lat={event.lat}
                    lon={event.lon}
                    already_checked_in={event.already_checked_in}
                    userLat={location?.latitude}
                    userLon={location?.longitude}
                    onCheckIn={() => handleCheckIn(event.id)}
                    checkInDistance={event.check_in_distance}
                    onPress={() =>
                      navigation.navigate("MyEventsDescription", {
                        id: event.id,
                        name: event.name,
                        organizer: event.organizer,
                        description: event.description,
                        start_date: event.start_date,
                        end_date: event.end_date,
                        lat: event.lat,
                        lon: event.lon,
                        webUrl: event.webUrl,
                        banner: event.banner,
                        isRegistered: event.is_registered,
                        checkInAvailable: event.check_in_available,
                        already_checked_in: event.already_checked_in,
                        totalConnections: event.totalConnections,
                        approvedRequests: event.approvedRequests,
                        pendingRequests: event.pendingRequests,
                        checkInDistance: event.check_in_distance,
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
  background: {
    flex: 1,
    resizeMode: 'cover',
    backgroundColor: 'rgb(227, 235, 250)',
  },
  scrollView: {
    padding: 16,
    paddingTop: 16,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
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
  monthTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  monthSection: {
    marginBottom: 24,
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
});

export default EventsScreen;
