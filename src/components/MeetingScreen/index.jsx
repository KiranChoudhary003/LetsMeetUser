import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';

const initialMeetings = [
  { id: '1', date: '12/07/2025', time: '10:00 AM', desc: 'Meet 1 dussion Meet 1 discussion Meet 1 discussion Meet 1 discussion  Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion Meet 1 discussion v' },
  { id: '2', date: '13/07/2025', time: '2:30 PM', desc: 'Meet sion' },
  { id: '3', date: '14/07/2025', time: '4:00 PM', desc: 'Hackathon planning' },
  { id: '4', date: '15/07/2025', time: '9:00 AM', desc: 'Daily sync-up' },
  { id: '5', date: '15/07/2025', time: '11:15 AM', desc: 'Team progress review' },
  { id: '6', date: '12/07/2025', time: '3:45 PM', desc: 'Project planning' },
  { id: '7', date: '13/07/2025', time: '5:00 PM', desc: 'Tech discussion' },
  { id: '8', date: '14/07/2025', time: '6:30 PM', desc: 'Event feedback' },
  { id: '9', date: '15/07/2025', time: '8:15 PM', desc: 'Retrospective meet' },
  { id: '10', date: '15/07/2025', time: '10:45 PM', desc: 'Final wrap-up' },
];

export default function MeetingScreen() {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  const openModal = (item) => {
    setSelectedMeeting(item);
    setEditedText(item.desc);
    setModalVisible(true);
    setIsEditing(false);
  };
  const navigation = useNavigation();
  const saveDescription = () => {
    const updatedMeetings = meetings.map((meeting) =>
      meeting.id === selectedMeeting.id
        ? { ...meeting, desc: editedText }
        : meeting
    );
    setMeetings(updatedMeetings);
    setSelectedMeeting({ ...selectedMeeting, desc: editedText });
    setIsEditing(false);
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.meetingCard}
      onPress={() => openModal(item)}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.meetingTitle}>Meet {index + 1}</Text>
        <Text style={styles.dateTime}>{item.date} at {item.time}</Text>
      </View>
      <Feather name="message-square" size={24} color="#111" />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Meetings</Text>
      </View>

      <View style={styles.container}>
        <Text style={styles.totalCount}>Total Meetings: {meetings.length}</Text>

        <FlatList
          data={meetings}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          style={{ flex: 1 }}
        />
      </View>

      {selectedMeeting && (
        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.modalContent}>
                <ScrollView style={{ maxHeight: 400 }}>
                  <Text style={styles.modalTitle}>Meeting Detail</Text>
                  <Text style={styles.modalDescription}>
                    Date: {selectedMeeting.date}{"\n"}
                    Time: {selectedMeeting.time}
                  </Text>

                  <Text style={[styles.modalDescription, { marginTop: 10 }]}>Description:</Text>
                  {isEditing ? (
                    <TextInput
                      multiline
                      style={styles.textInput}
                      value={editedText}
                      onChangeText={setEditedText}
                    />
                  ) : (
                    <Text style={styles.modalDescription}>{selectedMeeting.desc}</Text>
                  )}
                </ScrollView>

                <View style={styles.modalButtons}>
                  {isEditing ? (
                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: '#34495e' }]}
                      onPress={saveDescription}
                    >
                      <Text style={styles.editText}>Save</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => setIsEditing(true)}
                    >
                      <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
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
    backgroundColor: '#e8effc',
    paddingHorizontal: 16,

  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    paddingHorizontal: 16,
    backgroundColor: '#34495e',
    position: 'relative',
  },

  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  totalCount: {
    textAlign: 'left',
    fontSize: 16,
    fontWeight: 600,
    color: '#34495e',
    marginBottom: 10,
    marginTop: 20,
  },
  meetingCard: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
  },
  meetingTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111',
  },
  dateTime: {
    fontSize: 13,
    color: '#555',
  },
  separator: { height: 10 },
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
  textInput: {
    marginTop: 6,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  editButton: {
    backgroundColor: '#34495e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  closeButton: {
    backgroundColor: '#34495e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  editText: {
    color: '#fff',

    fontWeight: 'bold',
  },
});
