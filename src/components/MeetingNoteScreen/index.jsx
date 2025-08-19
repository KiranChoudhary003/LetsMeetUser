import { BlurView } from '@react-native-community/blur';
import { CommonActions } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getSocket } from '../../socket';
const MAX_CHARACTERS = 400;

const MeetingNoteScreen = ({ route, navigation }) => {
  const { meetingId } = route.params;
  const [note, setNote] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const socket = getSocket();
  const charCount = note.length;
  const [loading, setLoading] = useState(false);
  const handleNoteChange = (text) => {
    if (text.length <= MAX_CHARACTERS) {
      setNote(text);
    }
  };

  const submitNote = async () => {
    if (!socket || !socket.connected) { return; }
    setLoading(true);
    try {
      socket.emit('write_meeting_notes', { meetingId, notes: note });
    } catch (err) { }
  };

  useEffect(() => {
    const handleNoteSaved = ({ meetingId: returnedId }) => {
      if (returnedId === meetingId) {
        setLoading(false);
        setShowSuccessModal(true);
      }
    };

    socket.on('meeting_notes_updated', handleNoteSaved);
    return () => {
      socket.off('meeting_notes_updated', handleNoteSaved);
    };
  }, [meetingId, socket]);

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Layout', params: { screen: 'Home' } }],
      })
    );
  };


  return (
    <KeyboardAvoidingView
      style={styles.modalBackground}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.popupContainer}>
        <Text style={styles.label}>Write Meeting Notes</Text>

        <View style={styles.wordCountContainer}>
          <Text style={styles.wordCounterText}>
            {charCount}/{MAX_CHARACTERS} words
          </Text>
        </View>

        <ScrollView style={styles.inputWrapper} keyboardShouldPersistTaps="handled">
          <TextInput
            multiline
            style={styles.input}
            value={note}
            onChangeText={handleNoteChange}
            placeholder="Write your meeting notes here... (Leave empty if there are none or you can add them later)"
            placeholderTextColor="#888"
          />
        </ScrollView>

        <TouchableOpacity style={styles.submitButton} onPress={submitNote} disabled={loading}>
          <Text style={styles.submitButtonText}>{loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Notes</Text>
          )}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={showSuccessModal}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={4}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.5)"
          />
          <View style={styles.modalCard}>
            <MaterialIcons
              name="check-circle"
              size={60}
              color="#2ecc71"
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Notes Submitted</Text>
            <Text style={styles.modalText}>
              Your meeting notes have been successfully saved.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleCloseModal}>
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 50, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2c3e50',
    textAlign: 'center',
  },
  wordCountContainer: {
    alignItems: 'flex-end',
    marginBottom: 5,
  },
  wordCounterText: {
    fontSize: 14,
    color: '#555',
  },
  inputWrapper: {
    maxHeight: 300,
    marginBottom: 20,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#000',
    textAlignVertical: 'top',
    minHeight: 280,
  },
  submitButton: {
    backgroundColor: '#34495e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
  },
  modalIcon: {
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  modalText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#34495e',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default MeetingNoteScreen;
