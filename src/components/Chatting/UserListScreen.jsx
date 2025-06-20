import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    TextInput, ActivityIndicator, Image, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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

    const fetchConnections = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/user-chat/chat-connections`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setUsers(data.connections || []);
        } catch (error) {
            console.error('Error fetching connections:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => navigation.navigate('ChatPage', { peer: item })}
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
                    <Text style={styles.name}>{`${item.first_name} ${item.last_name}`}</Text>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.last_message || 'No message yet'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chat</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search Bar */}
            <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                placeholderTextColor="#888"
            />

            {/* User List */}
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 30 }} />
            ) : filteredUsers.length === 0 ? (
                <Text style={styles.noUsersText}>No users found</Text>
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafe',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    searchInput: {
        height: 45,
        borderColor: '#dcdde1',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        marginBottom: 15,
        fontSize: 16,
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
    noUsersText: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 16,
        color: '#999',
    },
});
