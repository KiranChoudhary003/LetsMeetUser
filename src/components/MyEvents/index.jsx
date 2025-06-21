import React, { useRef, useEffect, useState, useContext } from 'react';
import { Easing, Image } from 'react-native';

import {
  ScrollView,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
  ToastAndroid,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import profile from '../../assets/profile.png';
import scanner from '../../assets/scanner.png';
import connection from '../../assets/connection.png';
import chat from '../../assets/chat.png';
import { LocationContext } from '../LocationContext/LocationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const backgroundImage = require('../../assets/bgg.png');

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const Button = ({ children, onPress, variant }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        variant === 'ghost' ? styles.ghostButton : styles.filledButton,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'ghost' ? styles.ghostText : styles.filledText,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

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
    return R * c; // distance in KM
  };

  const checkProximityAndDate = () => {
    const eventDate = new Date(end_date);
    const today = new Date();
    setIsFutureEvent(eventDate > today);

    if (userLat != null && userLon != null && lat != null && lon != null) {
      const distance = calculateDistance(userLat, userLon, lat, lon);
      setWithinRange(distance <= 0.5); // Within 500 meters
    } else {
      setWithinRange(false);
    }
  };

  useEffect(() => {
    checkProximityAndDate();
  }, [userLat, userLon, lat, lon, end_date]);

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
          <Text style={styles.eventOrganizer}>{organizer}</Text>
          <Text style={styles.eventDate}>{new Date(start_date).toLocaleDateString()}</Text>
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
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>✔ Checked In</Text>
            </View>
          ) : isFutureEvent ? (
            <TouchableOpacity
              onPress={() => {
                if (withinRange) {
                  onCheckIn();
                } else {
                  ToastAndroid.show('You are outside the check-in range', ToastAndroid.SHORT);
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
          ) : null}
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

  const events = groupEventsByMonth(eventData);
  const animatedPosition = useRef(new Animated.Value(0)).current;

  const handleQRCode = () => {
    navigation.navigate('QRCode');
  };

  const handleProfile = () => {
    navigation.navigate('UserProfile');
  };

  const moveToRight = () => {
    Animated.timing(animatedPosition, {
      toValue: 120,
      duration: 500,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
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
    setLoading(true); // Show spinner
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        'https://letsmeet-backend-47lv.onrender.com/api/user-events/registered-events',
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
      }));

      setEventData(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error.message || error);
    } finally {
      setLoading(false); // Hide spinner
    }
  };


  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  return (
    <View source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.container}>

        <StatusBar barStyle="dark-content" />
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ marginBottom: 10, fontSize: 16, color: '#555' }}>Loading your events...</Text>
            <ActivityIndicator size="large" color="#34495e" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollView}>
            <View style={styles.header}>
              <View style={styles.eventsLabel}>
                <Text style={styles.eventsLabelText}>My Events</Text>
              </View>
            </View>

            {Object.entries(events).map(([month, data]) => (
              <View key={month} style={styles.monthSection}>
                <Text style={styles.monthTitle}>{`${data.monthName} ${data.year}`}</Text>

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
                        totalConnections: event.total_connections,
                        approvedRequests: event.approved_requests,
                        pendingRequests: event.pending_requests,
                        fetchUpcomingEvents,
                      })}
                  />
                ))}
              </View>
            ))}

          </ScrollView>
        )}
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
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#34495e',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  profile: {
    width: 35,
    height: 35,
  },
  headerstyle: {
    width: 45,
    height: 45,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 20,
  },
  headerItem: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#889999',
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
    marginLeft: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  monthTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    // fontStyle: "italic",
    color: '#333',
    marginBottom: 8,
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
    marginLeft: -3,
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
  bottomIconleft: {
    fontSize: 24,
    left: -20,
    color: 'white',
  },
  bottomIconright: {
    fontSize: 24,
    right: -25,
    color: 'white',
  },
});

export default EventsScreen;
