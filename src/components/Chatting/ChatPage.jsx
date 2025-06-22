import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    StatusBar,
    Platform,
    Image,
    Modal,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import moment from 'moment';
import profile from '../../assets/profile.png';

const ChatPage = ({ route }) => {
    const { peer } = route.params;
    const peer_id = peer.id;
    const peerAvatar = peer.photo;

    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserAvatar, setCurrentUserAvatar] = useState(null);
    const [messages, setMessages] = useState([]);
    const [groupedMessages, setGroupedMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [chatId, setChatId] = useState(null);
    const [loading, setLoading] = useState(true);

    const socketRef = useRef(null);
    const flatListRef = useRef(null);
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const groupMessagesByDate = (messages) => {
        const grouped = [];
        let lastDate = '';

        messages.forEach((msg) => {
            const date = moment(msg.createdAt).startOf('day');
            let label = moment().isSame(date, 'day')
                ? 'Today'
                : moment().subtract(1, 'day').isSame(date, 'day')
                    ? 'Yesterday'
                    : moment(date).format('MMM D, YYYY');

            if (label !== lastDate) {
                grouped.push({ type: 'date', label });
                lastDate = label;
            }
            grouped.push({ ...msg, type: 'message' });
        });
        return grouped;
    };

    useEffect(() => {
        let isMounted = true;
        async function initialize() {
            const token = await AsyncStorage.getItem('token');
            if (!token) { return; }

            const decoded = jwtDecode(token);
            const userId = decoded.id || decoded.user_id;
            setCurrentUserId(userId);

            const storedAvatar = await AsyncStorage.getItem('user_photo');
            if (storedAvatar) {
                setCurrentUserAvatar(storedAvatar);
            }

            const socket = io('https://letsmeet-backend-47lv.onrender.com/', {
                auth: { token },
                transports: ['websocket'],
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                socket.emit('fetch_chat', { peer_id });
            });

            socket.on('chat_data', ({ chat_id, messages: dataMsgs }) => {
                setChatId(chat_id);
                const loaded = dataMsgs.map((msg) => ({
                    id: msg.id,
                    text: msg.content,
                    createdAt: new Date(msg.sent_at),
                    from: msg.sender_id,
                    isRead: msg.is_read,
                })).sort((a, b) => a.createdAt - b.createdAt);

                setMessages(loaded);
                setGroupedMessages(groupMessagesByDate(loaded));
                scrollToBottom();

                if (isFocused) {
                    socket.emit('mark_read', { chat_id });
                }
                setLoading(false);
            });

            socket.on('receive_message', (msg) => {
                if (!isMounted) { return; }

                const newMsg = {
                    id: msg.id,
                    text: msg.content,
                    createdAt: new Date(msg.sent_at),
                    from: msg.sender_id,
                    isRead: msg.is_read,
                };

                setMessages((prev) => {
                    const updated = [...prev, newMsg];
                    setGroupedMessages(groupMessagesByDate(updated));
                    scrollToBottom();
                    return updated;
                });

                if (isFocused && chatId && msg.sender_id === peer_id) {
                    socket.emit('mark_read', { chat_id: chatId });
                }
            });

            socket.on('messages_marked_read', ({ message_ids }) => {
                setMessages((prev) => {
                    const updated = prev.map((msg) =>
                        message_ids.includes(msg.id) ? { ...msg, isRead: true } : msg
                    );
                    setGroupedMessages(groupMessagesByDate(updated));
                    return updated;
                });
            });

            socket.on('your_messages_read', ({ message_ids }) => {
                setMessages((prev) => {
                    const updated = prev.map((msg) =>
                        message_ids.includes(msg.id) ? { ...msg, isRead: true } : msg
                    );
                    setGroupedMessages(groupMessagesByDate(updated));
                    return updated;
                });
            });

            socket.on('typing', ({ from }) => {
                if (from === peer_id) {
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 2000);
                }
            });
        }

        initialize();
        return () => {
            isMounted = false;
            if (socketRef.current) { socketRef.current.disconnect(); }
        };
    }, [peer_id]);

    useEffect(() => {
        if (flatListRef.current && groupedMessages.length > 0) {
            setTimeout(() => {
                flatListRef.current.scrollToOffset({ offset: 0, animated: false });
            }, 100);
        }
    }, [groupedMessages]);

    useEffect(() => {
        if (isFocused && chatId && socketRef.current) {
            socketRef.current.emit('mark_read', { chat_id: chatId });
        }
    }, [isFocused, chatId]);

    useEffect(() => {
        if (!isFocused || !chatId || !socketRef.current) { return; }

        const hasUnread = messages.some(
            (msg) => msg.from === peer_id && !msg.isRead
        );

        if (hasUnread) {
            socketRef.current.emit('mark_read', { chat_id: chatId });
        }
    }, [messages, isFocused, chatId, peer_id]);

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
        });
    };

    const sendMessage = () => {
        if (inputText && socketRef.current && currentUserId) {
            const tempId = `${Date.now()}-${Math.random()}`;
            const tempMsg = {
                id: tempId,
                text: inputText,
                createdAt: new Date(),
                from: currentUserId,
                isRead: false,
            };
            const content = inputText;
            setInputText('');
            scrollToBottom();

            setMessages((prev) => {
                const updated = [...prev, tempMsg];
                setGroupedMessages(groupMessagesByDate(updated));
                return updated;
            });

            socketRef.current.emit('send_message', { to: peer_id, content });

            const handler = (msg) => {
                socketRef.current.off('message_sent', handler);
                const newMsg = {
                    id: msg.id,
                    text: msg.content,
                    createdAt: new Date(msg.sent_at),
                    from: msg.sender_id,
                    isRead: msg.is_read,
                };
                setMessages((prev) => {
                    const filtered = prev.filter(m => m.id !== tempId);
                    const updated = [...filtered, newMsg];
                    setGroupedMessages(groupMessagesByDate(updated));
                    return updated;
                });
                scrollToBottom();
            };
            socketRef.current.once('message_sent', handler);
        }
    };

    const handleTyping = (text) => {
        setInputText(text);
        socketRef.current?.emit('typing', { to: peer_id });
    };

    const renderItem = ({ item }) => {
        if (item.type === 'date') {
            return (
                <View style={styles.dateSeparator}>
                    <Text style={styles.dateText}>{item.label}</Text>
                </View>
            );
        }

        const isMe = item.from === currentUserId;
        const avatarUrl = isMe
            ? currentUserAvatar || Image.resolveAssetSource(profile).uri
            : peerAvatar || Image.resolveAssetSource(profile).uri;

        let tickIcon = null;
        let tickColor = '#000';

        if (isMe) {
            tickIcon = item.isRead ? 'checkmark-done' : 'checkmark';
            tickColor = item.isRead ? '#007aff' : '#000';
        }

        return (
            <View style={[styles.messageRow, isMe ? styles.rightRow : styles.leftRow]}>
                {!isMe && <Image source={{ uri: avatarUrl }} style={styles.avatar} />}
                <View style={[styles.messageBubble, isMe ? styles.messageRight : styles.messageLeft]}>
                    <Text style={[styles.messageText, { color: '#fff' }]}>{item.text}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Text style={styles.timestamp}>
                            {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {tickIcon && <Ionicons name={tickIcon} size={16} color={tickColor} style={{ marginLeft: 6 }} />}
                    </View>
                </View>
                {isMe && <Image source={{ uri: avatarUrl }} style={styles.avatar} />}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <SafeAreaView style={styles.container}>
                <StatusBar
                    translucent
                    backgroundColor="transparent"
                    barStyle={Platform.OS === 'ios' ? 'default' : 'dark-content'}
                />

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#007aff" />
                        <Text style={{ color: '#555', fontSize: 16, marginTop: 10 }}>
                            Loading chat messages...
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.chatHeader}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#ffffff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setModalVisible(true)}>
                                <Image
                                    source={peerAvatar ? { uri: peerAvatar } : profile}
                                    style={styles.headerAvatar}
                                />
                            </TouchableOpacity>
                            <Text style={styles.headerName}>
                                {`${peer.first_name} ${peer.last_name}`}
                            </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                            <FlatList
                                ref={flatListRef}
                                data={[...groupedMessages].reverse()}
                                renderItem={renderItem}
                                keyExtractor={(item, index) =>
                                    item.id ? item.id.toString() : `date-${index}`
                                }
                                contentContainerStyle={[styles.messagesContainer ]}
                                inverted={true}
                            />
                            {isTyping && <Text style={styles.typingText}>Typing...</Text>}
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        value={inputText}
                                        onChangeText={handleTyping}
                                        placeholder="Type a message..."
                                        placeholderTextColor="#888"
                                    />
                                </View>
                                <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                                    <Text style={styles.sendButtonText}>Send</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                <Modal
                    transparent
                    visible={isModalVisible}
                    animationType="fade"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <BlurView
                            style={StyleSheet.absoluteFill}
                            blurType="light"
                            blurAmount={10}
                            reducedTransparencyFallbackColor="white"
                        />
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalContent}>
                            <Image
                                source={peerAvatar ? { uri: peerAvatar } : profile}
                                style={styles.zoomedImage}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    </View>
                </Modal>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );

};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8effc',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },

    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#34495e',
        borderBottomWidth: 1,
        borderColor: '#e6e6e6',
    },
    backButton: {
        marginRight: 10,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#eee',
    },
    headerName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    messagesContainer: {
        flexGrow: 1,
        justifyContent: 'flex-end',
        paddingTop: 8,
        paddingBottom: 0,
    },
    dateSeparator: {
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: '#34495e',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginVertical: 10,
        backgroundColor: '#f0f0f0',
    },

    dateText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#555',
    },
    messageRow: { flexDirection: 'row', marginVertical: 6, alignItems: 'flex-end' },
    leftRow: { justifyContent: 'flex-start' },
    rightRow: { justifyContent: 'flex-end' },
    avatar: { width: 36, height: 36, borderRadius: 18, marginHorizontal: 6 },
    messageBubble: {
        padding: 12,
        borderRadius: 18,
        maxWidth: '75%',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    messageLeft: { backgroundColor: '#506d94', borderTopLeftRadius: 0 },
    messageRight: { backgroundColor: '#34495e', borderTopRightRadius: 0 },
    messageText: { fontSize: 16, lineHeight: 22 },
    timestamp: {
        fontSize: 10,
        opacity: 0.6,
        marginTop: 4,
        alignSelf: 'flex-end',
        color: '#ffffff',
    },
    typingText: {
        paddingLeft: 54,
        paddingBottom: 4,
        fontStyle: 'italic',
        color: '#444',
    },
    inputContainer: {
        padding: 10,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 10,
    },
    input: {
        flex: 1,
        height: 40,
        fontSize: 16,
        paddingHorizontal: 10,
        color: '#000',
    },
    sendButton: {
        marginLeft: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#007aff',
        borderRadius: 20,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomedImage: {
        width: '80%',
        height: '60%',
        borderRadius: 20,
    },

});

export default ChatPage;
