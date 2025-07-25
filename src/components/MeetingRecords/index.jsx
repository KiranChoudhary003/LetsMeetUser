import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
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

    useEffect(() => {
        const formattedMeetings = (user.meetings || []).map((meeting, index) => ({
            id: String(meeting.meeting_id),
            date: new Date(meeting.created_at).toLocaleDateString('en-GB'),
            time: new Date(meeting.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            desc: meeting.notes || 'No description',
            eventName: `Event ID ${meeting.event_id}`,
            userName: user.first_name + ' ' + (user.last_name || ''),
        }));
        setMeetings(formattedMeetings);
    }, []);

    const openModal = (item) => {
        setSelectedMeeting(item);
        setEditedText(item.desc);
        setModalVisible(true);
        setIsEditing(false);
    };

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
                <Text style={styles.meetingTitle}>Meet {index + 1} - {item.eventName}</Text>
                <Text style={styles.dateTime}>{item.date} at {item.time}</Text>
                <Text style={styles.dateTime}>By {item.userName}</Text>
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
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <ScrollView style={{ maxHeight: 400 }}>
                                    <Text style={styles.modalTitle}>Meeting Detail</Text>
                                    <Text style={styles.modalDescription}>
                                        Event: {selectedMeeting.eventName}{"\n"}
                                        Host: {selectedMeeting.userName}{"\n"}
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
