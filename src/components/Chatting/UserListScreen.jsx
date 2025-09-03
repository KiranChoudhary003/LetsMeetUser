import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image, Platform,
    StatusBar,
    useColorScheme,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { io } from 'socket.io-client';
import profile from '../../assets/profile.png';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


const API_URL = 'https://letsmeet-backend-47lv.onrender.com/api';

export default function UserListScreen() {
    const navigation = useNavigation();
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

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
            if (isFirstLoad) setIsFirstLoad(false);
        }
    };


    useEffect(() => {
        let socket;
        const setupSocket = async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) { return; }

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

    const handleQRCode = () => {
        navigation.navigate('QRCode');
    };

    const renderItem = ({ item }) => {
        const unreadCount = item.unread_count || 0;

        const handleDeleteChat = () => {
            Alert.alert(
                'Delete Chat',
                `Are you sure you want to delete chat with ${item.first_name} ${item.last_name}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        onPress: async () => {
                            try {
                                const token = await AsyncStorage.getItem('token');
                                const res = await fetch(`${API_URL}/user-chat/delete/${item.id}`, {
                                    method: 'DELETE',
                                    headers: { Authorization: `Bearer ${token}` },
                                });
                                const result = await res.json();
                                if (res.ok) {
                                    setUsers(prev => prev.filter(user => user.id !== item.id));
                                    Alert.alert('Success', 'Chat deleted successfully');
                                } else {
                                    Alert.alert('Error', result.message || 'Failed to delete chat');
                                }
                            } catch (err) {
                                console.error('Delete error:', err);
                                Alert.alert('Error', 'Error deleting chat');
                            }
                        },
                        style: 'destructive',
                    },
                ],
                { cancelable: true }
            );
        };

        return (
            <TouchableOpacity
                style={styles.userCard}
                onPress={() => navigation.navigate('ChatPage', { peer: item })}
                onLongPress={handleDeleteChat}
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

});
