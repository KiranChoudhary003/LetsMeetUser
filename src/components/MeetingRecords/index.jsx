import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
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
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';


export default function MeetingRecords() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = route.params;

    const [meetings, setMeetings] = useState([]);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState('');
    const MAX_CHARACTERS = 400;
    const charCount = editedText.length;
    const [isSaving, setIsSaving] = useState(false);


    const handleTextChange = (text) => {
        if (text.length <= MAX_CHARACTERS) {
            setEditedText(text);
        }
    };

    useEffect(() => {
        const formattedMeetings = (user.meetings || []).map((meeting, index) => ({
            id: meeting.meeting_id,
            meeting_id: meeting.meeting_id,
            date: new Date(meeting.created_at).toLocaleDateString('en-GB'),
            time: new Date(meeting.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            desc: meeting.notes || 'No notes available',
            eventName: `Event ID ${meeting.event_id}`,
            userName: [
                user.first_name,
                user.middle_name,
                user.last_name
            ].filter(Boolean).join(' '),

        }));
        setMeetings(formattedMeetings);
    }, []);

    const openModal = (item) => {
        setSelectedMeeting(item);
        setEditedText(item.desc);
        setModalVisible(true);
        setIsEditing(false);
    };

    // description
    const saveDescription = async () => {
        try {
            setIsSaving(true);
            const token = await AsyncStorage.getItem('token');
            const trimmedText = editedText.trim();

            await axios.put(
                `${BASE_URL}/api/user-connections/meetings/${selectedMeeting.meeting_id}/notes`,
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
        <TouchableOpacity
            style={styles.meetingCard}
            onPress={() => openModal(item)}
        >
            <View style={{ flex: 1 }}>
                <Text style={styles.meetingTitle}>Meet {index + 1}</Text>
                <Text style={styles.dateTime}>{item.date} at {item.time}</Text>
                <Text style={styles.dateTime}>By {item.userName}</Text>
            </View>
            <Feather name="message-square" size={24} color="#111" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#34495e', paddingTop: StatusBar.currentHeight }}>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
            />
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Meetings</Text>
            </View>

            <View style={styles.container}>
                <Text style={styles.totalCount}>Total Meetings: {meetings.length}</Text>

                {meetings.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 20 }}>No meetings found.</Text>
                ) : (
                    <FlatList
                        data={meetings}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        contentContainerStyle={styles.listContent}
                        style={{ flex: 1 }}
                    />
                )}
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
                                        Host: {selectedMeeting.userName}{'\n'}
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
                                        <View>
                                            <ScrollView
                                                style={styles.scrollArea}
                                                nestedScrollEnabled={true}
                                                showsVerticalScrollIndicator={true}
                                            >
                                                <TextInput
                                                    multiline
                                                    style={styles.textInput}
                                                    value={editedText}
                                                    onChangeText={handleTextChange}
                                                    placeholder="Edit meeting notes..."
                                                    placeholderTextColor="#888"
                                                />
                                            </ScrollView>
                                        </View>
                                    ) : (
                                        <View style={styles.descriptionBox}>
                                            <ScrollView
                                                style={styles.scrollArea}
                                                nestedScrollEnabled={true}
                                                showsVerticalScrollIndicator={true}
                                            >
                                                <Text style={styles.modalDescription}>{selectedMeeting.desc}</Text>
                                            </ScrollView>
                                        </View>

                                    )}

                                    <View style={styles.modalButtons}>
                                        {isEditing ? (
                                            <TouchableOpacity
                                                style={[styles.editButton, { backgroundColor: '#34495e', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', opacity: isSaving ? 0.8 : 1 }]}
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
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </Modal>
            )}
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
    descriptionBox: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 6,
        maxHeight: 180,
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
    wordCountContainer: {
        alignItems: 'flex-end',
        zIndex: 2,
    },
    wordCounterText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#34495e',
    },
});
