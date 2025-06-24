import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image, Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // ✅ added
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { io } from 'socket.io-client';
import profile from '../../assets/profile.png';


const API_URL = 'https://letsmeet-backend-47lv.onrender.com/api';

export default function UserListScreen() {
    const navigation = useNavigation();
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConnections();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchConnections();
        }, [])
    );


    const fetchConnections = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/user-chat/chat-connections`, {
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
        }
    };


    useEffect(() => {
        let socket;
        const setupSocket = async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) { return; }

            const decoded = jwtDecode(token);
            const currentUserId = decoded.id || decoded.user_id;

            socket = io('https://letsmeet-backend-47lv.onrender.com/', {
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
        user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }) => {
        const unreadCount = item.unread_count || 0;

        const handleDeleteChat = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const res = await fetch(`${API_URL}/user-chat/delete/${item.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });
                const result = await res.json();
                if (res.ok) {
                    setUsers(prev => prev.filter(user => user.id !== item.id));
                    alert('Chat deleted successfully');
                } else {
                    alert(result.message || 'Failed to delete chat');
                }
            } catch (err) {
                console.error('Delete error:', err);
                alert('Error deleting chat');
            }
        };

        const confirmDelete = () => {
            if (Platform.OS === 'web') {
                if (window.confirm(`Delete chat with ${item.first_name}?`)) {
                    handleDeleteChat();
                }
            } else {
                Alert.alert(
                    'Delete Chat',
                    `Are you sure you want to delete chat with ${item.first_name}?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', onPress: handleDeleteChat, style: 'destructive' },
                    ]
                );
            }
        };


        return (
            <TouchableOpacity
                style={styles.userCard}
                onPress={() => navigation.navigate('ChatPage', { peer: item })}
                onLongPress={confirmDelete}
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
                            <Text style={styles.name}>{`${item.first_name} ${item.last_name}`}</Text>
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
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.headingContainer}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back-outline" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Connections</Text>
                </View>
            </View>
            <View style={styles.searchBar}>
                <Entypo name="magnifying-glass" size={24} color="black" />
                <TextInput
                    placeholder="Search users..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    placeholderTextColor="#888"
                />
            </View>
            {loading ? (
                <View style={{ alignItems: 'center', marginTop: 30 }}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={{ marginTop: 10, color: '#555', fontSize: 14 }}>
                        Loading your connections...
                    </Text>
                </View>
            ) : filteredUsers.length === 0 ? (
                <Text style={styles.noUsersText}>No users found</Text>
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    extraData={users} // ✅ Ensures FlatList re-renders on state update
                    keyboardShouldPersistTaps="handled" // ✅ Allows input + touch to work smoothly
                    ListEmptyComponent={
                        !loading && (
                            <Text style={styles.noUsersText}>No users found</Text>
                        )
                    }
                />

            )}

            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => navigation.navigate('UserFriendList')}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafe',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 16,
    },
    safeContainer: {
        flex: 1,
        backgroundColor: '#f9fafe',
    },

    headingContainer: {
        backgroundColor: '#34495E',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        height: 40,
    },

    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        paddingRight: 12,
    },
    title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
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
    userCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
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
        backgroundColor: '#007AFF',
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

});
