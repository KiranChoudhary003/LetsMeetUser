import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const EventCard = ({ name, lastMeetingDate, meetingsCount, eventId, meetings }) => {
  const scale = new Animated.Value(1);
  const navigation = useNavigation();

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleNavigate = () => {
    navigation.navigate('MeetingScreen', {
      eventId,
      name,
      meetings,
    });
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handleNavigate}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.eventHeaderRow}>
            <Text style={styles.eventName} numberOfLines={2}
              ellipsizeMode="tail">{name}</Text>
            <View style={styles.meetingsCountBox}>
              <Text style={styles.meetingsCountText}>Meetings: {meetingsCount}</Text>
            </View>
          </View>
          <Text style={styles.eventDate}>
            Last Meeting:
            {lastMeetingDate
              ? ` ${lastMeetingDate.date} at ${lastMeetingDate.time}`
              : 'No meetings yet'}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

export default function UserEvents({ route }) {
  const navigation = useNavigation();
  const { events = [] } = route.params;
  const [search, setSearch] = useState('');

  const filteredEvents = events.filter(event =>
    event.event_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <StatusBar barStyle={useColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Events</Text>
        </View>

        <View style={styles.searchBar}>
          <Entypo name="magnifying-glass" size={24} color="black" />
          <TextInput
            placeholder="Search event..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#888"
          />
        </View>

        <Text style={styles.totalEventsText}>Total Events: {filteredEvents.length}</Text>

        <ScrollView contentContainerStyle={styles.scrollView}>
          {filteredEvents.map((event, index) => (
            <EventCard
              key={index}
              name={event.event_name}
              meetingsCount={event.meetings?.length || 0}
              eventId={event.event_id}
              meetings={Array.isArray(event.meetings) ? event.meetings : []}
              lastMeetingDate={event.lastMeetingDate}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EFFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34495e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 70,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  searchBar: {
    marginTop: 10,
    marginHorizontal: width * 0.03,
    paddingHorizontal: width * 0.03,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.3,
    borderColor: '#333',
    borderRadius: 25,
    backgroundColor: '#f9f9f9f7',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    paddingHorizontal: Platform.OS === 'ios' ? 4 : 4,
  },
  scrollView: {
    padding: 16,
  },
  totalEventsText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#34495e',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    width: '100%',
    minHeight: 50,
    marginVertical: 6,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  eventOrganizer: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  eventDate: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  meetingsCountBox: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  meetingsCountText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#34495e',
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
