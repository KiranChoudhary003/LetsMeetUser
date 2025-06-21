import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import profile from '../../assets/profile.png';

const API_URL = 'https://letsmeet-backend-47lv.onrender.com/api';

const NewChatScreen = () => {
    const navigation = useNavigation();
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAllUsers = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/user-chat/chat-connections`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setAllUsers(data.connections || []); // ✅ assuming `connections` is the array
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const handleSelectUser = (user) => {
        navigation.replace('ChatPage', { peer: user }); // Navigate to chat
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.userCard} onPress={() => handleSelectUser(item)}>
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
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{`${item.first_name} ${item.last_name}`}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.last_message || 'No message yet'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Chat</Text>
                <View style={{ width: 24 }} />
            </View>
            {loading ? (
                <View style={{ alignItems: 'center', marginTop: 30 }}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={{ marginTop: 10, color: '#555', fontSize: 14 }}>
                        Fetching your connections. Please wait...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={allUsers}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafe', padding: 16 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20, fontWeight: 'bold', color: '#2c3e50',
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        backgroundColor: '#eee',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
    },
    lastMessage: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
});

export default NewChatScreen;
