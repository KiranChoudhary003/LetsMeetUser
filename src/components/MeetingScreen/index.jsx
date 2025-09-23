import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function MeetingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { meetings: initialMeetings = [], name = 'Event' } = route.params;

  const [meetings, setMeetings] = useState(initialMeetings);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const MAX_CHARACTERS = 400;
  const charCount = editedText.length;

  const handleTextChange = (text) => {
    if (text.length <= MAX_CHARACTERS) {
      setEditedText(text);
    }
  };

  const openModal = (item) => {
    setSelectedMeeting(item);
    setEditedText(item.desc);
    setModalVisible(true);
    setIsEditing(false);
  };

  const saveDescription = async () => {
    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('token');
      const trimmedText = editedText.trim();

      await axios.put(
        `${BASE_URL}/api/user-connections/meetings/${selectedMeeting.id}/notes`,
        { notes: trimmedText },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedMeetings = meetings.map((meeting) =>
        meeting.id === selectedMeeting.id
          ? { ...meeting, desc: trimmedText }
          : meeting
      );

      setMeetings(updatedMeetings);
      setSelectedMeeting({ ...selectedMeeting, desc: trimmedText });
      setIsEditing(false);
      setModalVisible(false);
    } catch (error) {
      console.error('❌ Error saving notes:', error.response?.data || error.message);
      alert('Failed to save the note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };


  const renderItem = ({ item, index }) => (
    <TouchableOpacity style={styles.meetingCard} onPress={() => openModal(item)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.meetingTitle}>Meet {index + 1}</Text>
        <Text style={styles.dateTime}>{item.date} at {item.time}</Text>
      </View>
      <Feather name="message-square" size={24} color="#111" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#34495e' }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={{ flex: 1, backgroundColor: '#e8effc' }}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {name.split(' ').slice(0, 2).join(' ') + (name.split(' ').length > 2 ? '...' : '')} Meetings
          </Text>
        </View>

        <View style={styles.container}>
          <Text style={styles.totalCount}>Total Meetings: {meetings.length}</Text>
          <FlatList
            data={meetings}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id || index.toString()}
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
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Meeting Detail</Text>
                    <Text style={styles.modalDescription}>
                      Date: {selectedMeeting.date}{'\n'}
                      Time: {selectedMeeting.time}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.modalDescription}>Description:</Text>
                      {isEditing && (
                        <Text style={styles.wordCounterText}>
                          {charCount}/{MAX_CHARACTERS} words
                        </Text>
                      )}
                    </View>


                    {isEditing ? (
                      <ScrollView style={styles.scrollArea} nestedScrollEnabled showsVerticalScrollIndicator>
                        <TextInput
                          multiline
                          style={styles.textInput}
                          value={editedText}
                          onChangeText={handleTextChange}
                          placeholder="Edit meeting notes..."
                          placeholderTextColor="#888"
                        />
                      </ScrollView>
                    ) : (
                      <View style={styles.descriptionBox}>
                        <ScrollView style={styles.scrollArea} nestedScrollEnabled showsVerticalScrollIndicator>
                          <Text style={styles.modalDescription}>{selectedMeeting.desc}</Text>
                        </ScrollView>
                      </View>
                    )}

                    <View style={styles.modalButtons}>
                      {isEditing ? (
                        <TouchableOpacity
                          style={[styles.editButton, {
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            opacity: isSaving ? 0.8 : 1,
                          }]}
                          onPress={saveDescription}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Text style={styles.editText}>Saving</Text>
                              <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />
                            </>
                          ) : (
                            <Text style={styles.editText}>Save</Text>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                          <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>
        )}
      </View>
    </SafeAreaView>
  );
}

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
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  totalCount: {
    textAlign: 'left',
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 10,
    marginTop: 20,
  },
  meetingCard: {
    paddingVertical: 10,
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
  descriptionBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 6,
    maxHeight: 180,
  },
  textInput: {
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
  scrollArea: {
    maxHeight: 180,
  },
  wordCounterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#34495e',
  },
});
