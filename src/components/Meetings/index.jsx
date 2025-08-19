import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import { Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { BlurView } from '@react-native-community/blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');

const Meeting = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [profileView, setProfileView] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewName, setPreviewName] = useState('');

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get('https://letsmeet-backend-47lv.onrender.com/api/user-events/meetings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const usersWithMeetings = [];

        response.data?.connections?.forEach(connection => {
          const user = connection.user;
          const eventsWithMeetings = connection.events
            ?.filter(e => e.meetings && e.meetings.length > 0)
            .map(e => ({
              ...e,
              meetings: e.meetings.map(m => ({
                id: m.meeting_id,
                desc: m.notes || 'No notes available',
                date: new Date(m.created_at).toLocaleDateString(),
                time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              })),
            }));

          if (eventsWithMeetings.length > 0) {
            usersWithMeetings.push({
              id: user.id,
              name: `${user.first_name} ${user.last_name}`,
              role: user.role || 'Attendee',
              photo: user.photo || '',
              email: user.email || '',
              linkedin: user.linkedin_url || '',
              preference: user.preference || [],
              eventCount: eventsWithMeetings.length,
              events: eventsWithMeetings,
            });
          }
        });

        setRequests(usersWithMeetings);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch meetings:', error);
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const filteredRequests = requests.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const initials = item.name ? item.name.split(' ').map(w => w[0]).join('').toUpperCase() : 'NA';

    const handleImagePress = () => {
      const imgUri = item.photo?.startsWith('data:image') ? item.photo : item.photo || '';
      setPreviewImage(imgUri);
      setPreviewName(initials);
      setProfileView(true);
    };

    return (
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <TouchableOpacity onPress={handleImagePress}>
            <View style={styles.profileCircle}>
              {item.photo && item.photo.length > 10 ? (
                <Image source={{ uri: item.photo }} style={styles.profileImage} />
              ) : (
                <Text style={styles.initialsText}>{initials}</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('UserEvents', {
              user: {
                first_name: item.name,
                attendees_role: item.role,
                photo: item.photo,
                email: item.email,
                linkedin_url: item.linkedin,
                preference: Array.isArray(item.preference) ? item.preference : [],
              },
              events: item.events,
            })}
            style={{ flex: 1 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.eventBadge}>Events: {item.eventCount}</Text>
            </View>
            <Text style={styles.roleText}>{item.role}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#34495E' }}>
      <StatusBar barStyle="light-content" backgroundColor="#34495E" />
      <View style={{ flex: 1, backgroundColor: '#E8EFFC' }}>
        <View style={styles.header}>
          <Text style={styles.meetHeading}>Meetings</Text>
        </View>

        <View style={styles.searchBar}>
          <Entypo name="magnifying-glass" size={24} color="black" />
          <TextInput
            placeholder="Search user..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#888"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Entypo name="cross" size={24} color="black" />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <Text style={{ fontSize: 16, color: '#333', fontWeight: 600 }}>
            Total Users: {filteredRequests.length}
          </Text>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator size="large" color="#34495e" />
            <Text style={{ marginTop: 10, fontSize: 16, color: '#333' }}>Fetching meetings...</Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.filterResultContainer}>
            <Text style={styles.filterResultText}>No users with meetings found!</Text>
            <LottieView
              style={styles.lottieContainer}
              source={require('../../assets/Not-Found.json')}
              autoPlay
              loop
              resizeMode="cover"
            />
          </View>
        ) : (
          <FlatList
            data={filteredRequests}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        )}

        <Modal visible={profileView} transparent animationType="fade">
          <BlurView
            style={styles.blur}
            blurType="light"
            blurAmount={15}
            reducedTransparencyFallbackColor="white"
          />
          <TouchableOpacity style={styles.modalOverlay} onPressOut={() => setProfileView(false)}>
            <View style={styles.modalContent}>
              {previewImage && previewImage.length > 100 ? (
                <Image source={{ uri: previewImage }} style={styles.fullImage} resizeMode="contain" />
              ) : (
                <View style={[styles.circle, styles.fullImageFallback]}>
                  <Text style={styles.initialsPreview}>{previewName}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default Meeting;

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
    position: 'relative',
    alignItems: 'center',
  },
  meetHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 20,
    backgroundColor: '#34495e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.8,
    marginHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileCircle: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: (width * 0.12) / 2,
    backgroundColor: '#34495E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.12) / 2,
  },
  initialsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    maxWidth: width * 0.4,
  },
  eventBadge: {
    fontSize: 13,
    color: '#34495e',
    fontWeight: 'bold',
  },
  roleText: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  filterResultContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  filterResultText: {
    fontSize: 16,
    color: '#555',
  },
  lottieContainer: {
    marginTop: 50,
    height: 200,
    width: 200,
  },
  blur: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  fullImage: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  fullImageFallback: {
    backgroundColor: '#211e1e',
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  initialsPreview: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 150,
    textAlign: 'center',
    lineHeight: 300,
  },
});
