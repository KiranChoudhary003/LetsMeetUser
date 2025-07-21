import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import { getSocket } from '../../socket';

const MeetingNoteScreen = ({ route, navigation }) => {
  const { meetingId } = route.params;
  const [note, setNote] = useState('');

  const submitNote = () => {
    const socket = getSocket();
    socket.emit('write_meeting_notes', { meetingId, notes: note });
    Alert.alert('Notes Submitted!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Write Meeting Notes</Text>
      <TextInput
        multiline
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="Write something..."
      />
      <Button title="Submit Notes" onPress={submitNote} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 18, marginBottom: 10 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    minHeight: 100,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
})

export default MeetingNoteScreen;