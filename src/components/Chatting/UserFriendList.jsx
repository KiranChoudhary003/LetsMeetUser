import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
            const allUsers = data.connections || [];
            setUsers(allUsers);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let socket;
        const setupSocket = async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

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
                                last_message_time: msg.sent_at,
                                unread_count: (user.unread_count || 0) + 1,
                            };
                        }
                        return user;
                    });
                    return updatedUsers.sort((a, b) =>
                        new Date(b.last_message_time) - new Date(a.last_message_time)
                    );
                });
            });

            socket.on('messages_marked_read', ({ chat_id }) => {
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user.chat_id === chat_id
                            ? { ...user, unread_count: 0 }
                            : user
                    ).sort((a, b) =>
                        new Date(b.last_message_time) - new Date(a.last_message_time)
                    )
                );
            });
        };

        setupSocket();

        return () => {
            if (socket) {
                socket.off('receive_message');
                socket.off('messages_marked_read');
                socket.disconnect();
            }
        };
    }, []);

    const filteredUsers = users.filter(user =>
        (`${user.first_name} ${user.last_name}`).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => navigation.navigate('ChatPage', { peer: item, from: 'UserFriendList' })}
        >
            <View style={styles.row}>
                <Image
                    source={
                        item.photo
                            ? {
                                uri: item.photo.startsWith('data:image') || item.photo.startsWith('http')
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
                    </View>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.last_message}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.headingContainer}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => {
                            if (navigation.canGoBack()) navigation.goBack();
                        }}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back-outline" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>My Network</Text>
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
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Fetching your connections. Please wait...</Text>
                </View>
            ) : users.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>You have no connections.</Text>
                </View>
            ) : filteredUsers.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No users found.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#e8effc',
    },
    headingContainer: {
        backgroundColor: '#34495E',
        paddingVertical: 12,
        paddingHorizontal: 16,
        height : 70
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
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
    },
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
    lastMessage: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
    loadingContainer: {
        alignItems: 'center',
        marginTop: 30,
    },
    loadingText: {
        marginTop: 10,
        color: '#555',
        fontSize: 14,
    },
    emptyState: {
        marginTop: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
});
