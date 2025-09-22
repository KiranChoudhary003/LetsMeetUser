import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image, Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
    Modal,
    Modal as DeleteModal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { io } from 'socket.io-client';
import profile from '../../assets/profile.png';
import { BlurView } from '@react-native-community/blur';

export default function UserListScreen() {
    const navigation = useNavigation();
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [AlertVisible, setAlertVisible] = useState(false);
    const [AlertMessage, setAlertMessage] = useState('');
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);



    useFocusEffect(
        useCallback(() => {
            fetchConnections();
        }, [])
    );

    const triggerEventAlert = (message) => {
        setAlertMessage(message);
        setAlertVisible(true);
    };


    const fetchConnections = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/api/user-chat/chat-connections`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            const filtered = (data.connections || [])
                .filter(user => user.chat_id && user.last_message)
                .sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
            setUsers(filtered);
        } catch (error) {
            console.error('Error fetching connections:', error);
        } finally {
            setLoading(false);
            if (isFirstLoad) setIsFirstLoad(false);
        }
    };


    useEffect(() => {
        let socket;
        const setupSocket = async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) { return; }

            socket = io(BASE_URL, {
                auth: { token },
                transports: ['websocket'],
            });

            socket.on('receive_message', (msg) => {
                setUsers(prevUsers => {
                    const updatedUsers = prevUsers.map(user => {
                        if (user.id === msg.sender_id) {
                            return {
                                ...user,
                                last_message: msg.content,
                                last_message_time: msg.sent_at, // Make sure this is a valid date string
                                unread_count: (user.unread_count || 0) + 1,
                            };
                        }
                        return user;
                    });
                    return updatedUsers.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
                });
            });


            socket.on('messages_marked_read', ({ chat_id }) => {
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user.chat_id === chat_id ? { ...user, unread_count: 0 } : user
                    )
                        .sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)) // ✅ Keep sorted
                );
            });

        };

        setupSocket();
        return () => {
            if (socket) { socket.disconnect(); }
        };
    }, []);

    const filteredUsers = users.filter(user =>
        [
            user.first_name,
            user.middle_name,
            user.last_name,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );


    const handleQRCode = () => {
        navigation.navigate('QRCode');
    };

    const handleDeleteChat = async (user) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/user-chat/delete/${user.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== user.id));
                triggerEventAlert('The chat has been successfully deleted.');
            } else {
                triggerEventAlert(result.message || 'Chat could not be deleted. Please try again.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            triggerEventAlert('Unable to delete chat. Please try again.');
        }
    };

    const renderItem = ({ item }) => {
        const unreadCount = item.unread_count || 0;

        return (
            <TouchableOpacity
                style={styles.userCard}
                onPress={() => navigation.navigate('ChatPage', { peer: item })}
                onLongPress={() => {
                    setSelectedUser(item);
                    setConfirmVisible(true);
                }}
            >
                <View style={styles.row}>
                    <Image
                        source={
                            item.photo
                                ? {
                                    uri:
                                        item.photo.startsWith('data:image') || item.photo.startsWith('http')
                                            ? item.photo
                                            : `data:image/jpeg;base64,${item.photo}`,
                                }
                                : profile
                        }
                        style={styles.avatar}
                    />
                    <View style={styles.info}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>
                                {[
                                    item.first_name,
                                    item.middle_name, // include middle name
                                    item.last_name
                                ].filter(Boolean).join(' ')}
                            </Text>
                            {unreadCount > 0 && (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadText}>{unreadCount}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {item.last_message}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <StatusBar barStyle={useColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />
            <SafeAreaView style={styles.safeContainer}>
                <View style={styles.headingContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back-outline" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Connections</Text>
                    <TouchableOpacity onPress={handleQRCode}>
                        <MaterialCommunityIcons name="qrcode-scan"
                            size={30}
                            color="#f9efef"
                            style={styles.Chatstyle}
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.searchBar}>
                    <Entypo name="magnifying-glass" size={24} color="black" />
                    <TextInput
                        placeholder="Search users..."
                        style={styles.searchInput}
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        placeholderTextColor="#888"
                    />
                </View>
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                    refreshing={loading && !isFirstLoad && users.length > 0}
                    onRefresh={fetchConnections}
                    extraData={users}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        loading ? (
                            <View style={{ alignItems: 'center', marginTop: 30 }}>
                                <ActivityIndicator size="large" color="#34495e" />
                                <Text style={{ marginTop: 10, color: '#555', fontSize: 14 }}>
                                    Loading your connections...
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.noUsersText}>No users found</Text>
                        )
                    }
                />

                <TouchableOpacity
                    style={styles.floatingButton}
                    onPress={() => navigation.navigate('UserFriendList')}
                >
                    <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>
                <Modal
                    transparent
                    visible={AlertVisible}
                    animationType="fade"
                    onRequestClose={() => setAlertVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.overlayBox}
                        activeOpacity={1}
                        onPressOut={() => setAlertVisible(false)}
                    >
                        {/* Blur background */}
                        <BlurView
                            style={StyleSheet.absoluteFill}
                            blurType="light"                           // keep it light for premium subtlety
                            blurAmount={3}                            // stronger blur for soft glass effect
                            reducedTransparencyFallbackColor="rgba(255,255,255,0.1)"  // very subtle fallback
                        />

                        <View style={styles.containerBox}>
                            <Text style={styles.titleBox}>Message</Text>
                            <Text style={styles.messageBox}>{AlertMessage}</Text>
                            <TouchableOpacity
                                onPress={() => setAlertVisible(false)}
                                style={styles.buttonBox}
                            >
                                <Text style={styles.buttonTextBox}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
                <DeleteModal
                    visible={confirmVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setConfirmVisible(false)}
                >
                    <View style={styles.overlay}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.deleteTitle}>Confirm Action</Text>
                            {selectedUser && (
                                <Text style={styles.message}>
                                    Are you sure you want to delete{" "}
                                    <Text style={{ fontWeight: '700' }}>
                                        {[selectedUser.first_name, selectedUser.middle_name, selectedUser.last_name]
                                            .filter(Boolean)
                                            .join(' ')}
                                    </Text>
                                    's chat?
                                </Text>
                            )}

                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={() => setConfirmVisible(false)}
                                >
                                    <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, styles.rejectButton]}
                                    onPress={async () => {
                                        setConfirmVisible(false); // hide modal
                                        if (selectedUser) {
                                            await handleDeleteChat(selectedUser); // delete selected user
                                            setSelectedUser(null); // reset
                                        }
                                    }}
                                >
                                    <Text style={styles.buttonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </DeleteModal>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#e8effc',
    },

    headingContainer: {
        backgroundColor: '#34495E',
        paddingHorizontal: 16,
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', flex: 1, textAlign: 'center' },
    searchBar: {
        margin: 15,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
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
    userCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 5,
        marginHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        marginRight: 14,
        backgroundColor: '#eee',
    },
    info: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 17,
        fontWeight: '600',
        color: '#2c3e50',
    },
    unreadBadge: {
        backgroundColor: '#ff3b30',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
        minWidth: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unreadText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    lastMessage: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
    noUsersText: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 16,
        color: '#999',
    },
    floatingButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#34495e',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    overlayBox: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    containerBox: {
        backgroundColor: '#fff',
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderRadius: 16,
        minWidth: '60%',
        maxWidth: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    titleBox: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center',
        color: '#222',
    },
    messageBox: {
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
        color: '#555',
        lineHeight: 20,
    },
    buttonBox: {
        backgroundColor: '#34495E',
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
    },
    buttonTextBox: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        textAlign: 'center',
        letterSpacing: 0.4,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 8,
    },
    deleteTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
        color: '#34495e',
    },
    message: {
        fontSize: 15,
        color: '#555',
        marginBottom: 20,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginLeft: 10,
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    rejectButton: {
        backgroundColor: '#e74c3c',
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 14,
        color: '#fff',
    },
    cancelText: {
        color: '#34495e',
    },
});
