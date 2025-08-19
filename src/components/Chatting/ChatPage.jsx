import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@react-native-community/blur';
import { CommonActions, useIsFocused, useNavigation } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Keyboard,
    Modal,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { io } from 'socket.io-client';
import profile from '../../assets/profile.png';
import { FlashList } from '@shopify/flash-list';


const ChatPage = ({ route }) => {
    const { peer } = route.params;
    const peer_id = peer.id;
    const peerAvatar = peer.photo;
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
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
    const [loadingOlder, setLoadingOlder] = useState(false);



    useEffect(() => {
        const keyboardDidShow = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
            setIsKeyboardVisible(true);
        });

        const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
            setIsKeyboardVisible(false);
        });

        return () => {
            keyboardDidShow.remove();
            keyboardDidHide.remove();
        };
    }, []);


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


    const scrollToBottom = (animated = false) => {
        requestAnimationFrame(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated });
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
                    const updated = prev.map((m) =>
                        m.id === tempId ? newMsg : m
                    );
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

    const fromScreen = route.params?.from;
    const handleBack = () => {
        if (fromScreen === 'UserFriendList') {
            navigation.dispatch(
                CommonActions.reset({
                    index: 1,
                    routes: [
                        { name: 'Layout' },
                        { name: 'UserListScreen' },
                    ],
                })
            );
        } else {
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate('UserListScreen');
            }
        }
    };

    const scrollOffsetY = useRef(0);
    const handleScroll = (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        scrollOffsetY.current = offsetY;

        if (offsetY < 100 && !loadingOlder) {
            loadOlderMessages();
        }
    };

    const loadOlderMessages = () => {
        if (loadingOlder) {return;}
        setLoadingOlder(true);

        setTimeout(() => {
            const older = [...Array(5)].map((_, i) => ({
                id: `old-${Date.now()}-${i}`,
                text: `Old message ${i + 1}`,
                createdAt: new Date(Date.now() - (i + 1) * 60000),
                from: peer_id,
                isRead: true,
            }));

            setMessages((prev) => {
                const combined = [...older, ...prev];
                setGroupedMessages(groupMessagesByDate(combined));
                return combined;
            });

            setTimeout(() => {
                setLoadingOlder(false);
            }, 50);
        }, 800);
    };

    return (
        <>
            <StatusBar
                translucent
                backgroundColor="#34495e"
                barStyle={Platform.OS === 'ios' ? 'default' : 'dark-content'}
            />
            <SafeAreaView style={styles.container}>

                <View style={{ flex: 1 }}>
                    {loading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#34495e" />
                            <Text style={{ color: '#555', fontSize: 16, marginTop: 10 }}>
                                Loading chat messages...
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.chatHeader}>
                                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
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
                                {loadingOlder && (
                                    <View style={{ alignItems: 'center', paddingVertical: 6 }}>
                                        <ActivityIndicator size="large" color="#007aff" />
                                    </View>
                                )}
                                <FlashList
                                    ref={flatListRef}
                                    data={[...groupedMessages].reverse()}
                                    renderItem={renderItem}
                                    keyExtractor={(item, index) =>
                                        item.id ? item.id.toString() : `date-${index}`
                                    }
                                    contentContainerStyle={styles.messagesContainer}
                                    estimatedItemSize={80}
                                    inverted
                                    initialNumToRender={20}
                                    maxToRenderPerBatch={10}
                                    windowSize={7}
                                    removeClippedSubviews={false}
                                    keyboardShouldPersistTaps="handled"
                                    scrollEventThrottle={16}
                                    onScroll={handleScroll}
                                    extraData={loadingOlder}
                                />

                                <View
                                    style={[
                                        styles.floatingInputContainer,
                                        {
                                            paddingBottom: isKeyboardVisible
                                                ? keyboardHeight + (Platform.OS === 'ios' ? 0 : 10)
                                                : Platform.OS === 'ios'
                                                    ? 20
                                                    : 10,
                                        },
                                    ]}
                                >
                                    {isTyping && <Text style={styles.typingText}>Typing...</Text>}
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={styles.inputWrapper}>
                                            <TextInput
                                                style={styles.input}
                                                value={inputText}
                                                onChangeText={handleTyping}
                                                placeholder="Type a message..."
                                                placeholderTextColor="#888"
                                                multiline
                                            />
                                        </View>
                                        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                                            <FontAwesome name="send" size={22} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                        </>
                    )}
                </View>
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
            </SafeAreaView >
        </>
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
        paddingHorizontal: 16,
        backgroundColor: '#34495e',
        borderBottomWidth: 1,
        borderColor: '#e6e6e6',
        height : 70,
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
        paddingLeft: 14,
        paddingBottom: 4,
        fontStyle: 'italic',
        color: '#444',
    },
    floatingInputContainer: {
        position: 'relative',
        left: 0,
        right: 0,
        paddingHorizontal: 10,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        paddingTop: 5,
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
        backgroundColor: '#34495e',
        borderRadius: 20,
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
