import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
 


const meetingsData = [
  { id: '1', userName: 'User name', event: 'Event', date: '12/07/2025' },
  { id: '2', userName: 'User name', event: 'Event', date: '13/07/2025' },
  { id: '3', userName: 'harsh', event: 'hackathon', date: '14/07/2025' },
  { id: '4', userName: 'User name', event: 'Event', date: '15/07/2025' },
  { id: '5', userName: 'User name', event: 'Event', date: '15/07/2025' },
  { id: '6', userName: 'User name', event: 'Event', date: '12/07/2025' },
  { id: '7', userName: 'User name', event: 'Event', date: '13/07/2025' },
  { id: '8', userName: 'harsh', event: 'Event', date: '14/07/2025' },
  { id: '9', userName: 'User name', event: 'Event', date: '15/07/2025' },
  { id: '10', userName: 'User name', event: 'Event', date: '15/07/2025' },
];

export default function MeetingsScreen() {
   const navigation = useNavigation(); 
  const [search, setSearch] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredMeetings = meetingsData.filter(item =>
    `${item.userName} ${item.event}`.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={styles.meetingCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{item.userName}</Text>
        <Text style={styles.eventName}>{item.event}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          setSelectedMeeting(item);
          setModalVisible(true);
        }}>
       <Feather name="message-square" size={24} color="#34495e" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() =>  navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Meetings</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
         <Feather name="search" size={18} color="#000" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for name and events"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Count */}
      <Text style={styles.totalCount}>Total meets: {filteredMeetings.length}</Text>

      {/* List */}
      <FlatList
        data={filteredMeetings}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        style={{ flex: 1 }}
      />

      {/* Modal */}
      {selectedMeeting && (
        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView style={{ maxHeight: 400 }}>
                <Text style={styles.modalTitle}>
                  Discussion with {selectedMeeting.userName}
                </Text>

                <Text style={styles.modalDescription}>
                  Remark: ✍️ Coming soon…{"\n\n"}
                  The decision about what to put into your paragraphs begins
                  with the germination of a seed of ideas; this “germination
                  process” is better known as brainstorming. There are many
                  techniques for brainstorming; whichever one you choose,
                  this stage of paragraph development cannot be skipped.
                  Building paragraphs can be like building a skyscraper:
                  there must be a well-planned foundation that supports what
                  you are building. Any cracks, inconsistencies, or other
                  corruptions of the foundation can cause your whole paper
                  to crumble.
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff', // Softer & brighter than old #e8effc
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  // header: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   marginBottom: 16,
  //   justifyContent: 'space-between',
  // },
  // headerTitle: {
  //   fontSize: 20,
  //   fontWeight: 'bold',
  //   flex: 1,
  //   textAlign: 'center',
  //   marginLeft: -24,
  //   color: '#2c3e50',
  // },
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 16,
  paddingHorizontal: 4,
},
headerTitle: {
  flex: 1,
  fontSize: 20,
  fontWeight: 'bold',
  textAlign: 'center',
  color: '#2c3e50',
},

  emoji: { fontSize: 22, marginHorizontal: 5 },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  totalCount: { textAlign: 'right', fontSize: 14, color: '#34495e', marginBottom: 10 },

  meetingCard: {
    //backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,       // ✅ Add this line
    borderBottomColor: '#000',

  },
  userName: { fontWeight: 'bold', fontSize: 16, color: '#2c3e50' },
  eventName: { fontSize: 14, color: '#34495e' },
  date: { fontSize: 13, color: '#7f8c8d' },
  separator: { height: 10 }, // spacing instead of dark lines
  listContent: { paddingBottom: 20, paddingTop: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  modalDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#34495e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
