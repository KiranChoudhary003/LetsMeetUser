/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@react-native-community/blur';
import axios from 'axios';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity,
  View
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
  triggerEventAlert,
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
            justifyContent: 'space-around',
            alignItems: 'center',
          },
        ]}
      >
        <View style={{ flex: 1, justifyContent: 'space-evenly' }}>
          <Text style={styles.eventName}>{name}</Text>
          <View style={[styles.bottomRow, { flex: 1, justifyContent: 'space-evenly' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location-sharp" size={14} color="#34495e" style={{ marginRight: 4 }} />
              <Text style={styles.eventOrganizer}>{organizer}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Fontisto name="date" size={14} color="#34495e" style={{ marginRight: 4 }} />
              <Text style={styles.eventDate}>{formatDate(start_date)}</Text>
            </View>
          </View>
        </View>

        <View>
          {already_checked_in ? (
            <View style={{
              backgroundColor: '#4CAF50',
              paddingHorizontal: 12,
              paddingVertical: 6,
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
                  triggerEventAlert(
                    `Check-in is temporarily disabled.\nYou’ll be able to check in once you are within ${(checkInDistance).toFixed(2)} km of the event location on the scheduled day.`
                  );
                }
              }}
              style={{
                backgroundColor: withinRange ? '#4CAF50' : '#bbb',
                paddingHorizontal: 12,
                paddingVertical: 6,
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
              paddingVertical: 6,
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
  const [AlertVisible, setAlertVisible] = useState(false);
  const [AlertMessage, setAlertMessage] = useState('');
  const events = groupEventsByMonth(eventData);

  const triggerEventAlert = (message) => {
    setAlertMessage(message);
    setAlertVisible(true);
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
      fetchUpcomingEvents();
    } catch (error) {
      triggerEventAlert(
        error.response?.data?.message || 'Something went wrong. Please try again.'
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
      if (isFirstLoad) { setIsFirstLoad(false); }
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
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
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
              colors={['#34495e']}
              tintColor="#34495e"
            />
          }
        >
          {loading && eventData.length === 0 ? (
            <View
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text
                style={{ marginBottom: 10, fontSize: 16, color: '#555' }}
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
                  fontWeight: '600',
                  color: '#2c3e50',
                  marginTop: 16,
                  textAlign: 'center',
                }}
              >
                No Events Found
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#7f8c8d',
                  textAlign: 'center',
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
                    triggerEventAlert={triggerEventAlert}
                    onPress={() =>
                      navigation.navigate('MyEventsDescription', {
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
    minHeight: 80,
    marginVertical: 2,
    borderBottomWidth: 0.5,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    flexShrink: 1,
    maxWidth:230,
  },
  bottomRow: {
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  eventOrganizer: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
    flexShrink: 1,
    maxWidth:190,
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

export default EventsScreen;
