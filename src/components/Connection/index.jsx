import React, { useEffect, useState } from 'react';
// import Entypo from 'react-native-vector-icons/Entypo';
// import Ionicons from 'react-native-vector-icons/Ionicons';
import {
    Alert,
    Animated,
    FlatList,
    Image,
    ImageBackground,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const dummyUsers = [
    { id: 1, name: 'Ajay Kumar', image: null },
    { id: 2, name: 'cool Coder99', image: null },
    { id: 3, name: 'reactNative Pro', image: 'https://i.pravatar.cc/50?img=3' },
    { id: 4, name: 'swift Tiger', image: null },
    { id: 5, name: 'pixel Master', image: null },
    { id: 6, name: 'sunny_dev', image: 'https://i.pravatar.cc/50?img=5' },
    { id: 7, name: 'alpha Bravo', image: null },
    { id: 8, name: 'codeWith Jay', image: null },
    { id: 9, name: 'Ajay Kumar', image: null },
    { id: 10, name: 'cool Coder99', image: null },
    { id: 11, name: 'mystic Coder', image: null },
    { id: 12, name: 'data Ninja', image: null },
];

const allUsers = [
    { id: 101, name: 'Arun Dev', image: null },
    { id: 102, name: 'logic_Lord', image: 'https://i.pravatar.cc/50?img=8' },
    { id: 103, name: 'fancy Coder John', image: null },
    { id: 104, name: 'frontend_Wiz', image: null },
    { id: 105, name: 'deepTechie', image: null },
    { id: 106, name: 'designGuru', image: null },
    { id: 107, name: 'Arun Dev', image: null },
    { id: 108, name: 'logic_Lord', image: null },
    { id: 109, name: 'clean Coder', image: null },
    { id: 110, name: 'API Wizard', image: null },
    { id: 111, name: 'testing Ninja', image: null },
    { id: 112, name: 'JS Beast', image: null },
    { id: 113, name: 'auth King', image: null },
]

const Connection = ({navigation}) => {
    const [selectedTab, setSelectedTab] = useState('Requests');
    const [search, setSearch] = useState('');
    const [acceptedUsers, setAcceptedUsers] = useState({});
    const [undoUser, setUndoUser] = useState(null);
    const [requestStatus, setRequestStatus] = useState({});
    const [toast, setToast] = useState('');
    const [showUndo, setShowUndo] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [requests, setRequests] = useState(dummyUsers);

    useEffect(() => {
        if (toast) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            const timer = setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => setToast(''));
            }, 5000);

            return () => {
                clearTimeout(timer);
                clearTimeout(Connections.undoTimer);
            };
        }
    }, [toast, fadeAnim]);

    const handleAccept = (user) => {
        if (acceptedUsers[user.id]) {
            return;
        }
        if (undoUser) {
            setRequests((prev) => prev.filter((u) => u.id !== undoUser.id));
        }

        setAcceptedUsers((prev) => ({ ...prev, [user.id]: true }));
        setUndoUser(user);
        setShowUndo(true);
        setToast(`You accepted ${user.name} connection request`);

        if (Connection.undoTimer) {
            clearTimeout(Connection.undoTimer);
        }

        // Set timeout to hide the undo user
        Connection.undoTimer = setTimeout(() => {
            setRequests((prev) => prev.filter((u) => u.id !== user.id));
            setShowUndo(false);
            setUndoUser(null);
        }, 5000); // 5 seconds
    };

    const handleCancel = (user) => {
        const confirmMessage = `Are you sure you want to cancel ${user.name}'s request?`;
        Alert.alert(
            'Confirm Deletion',
            confirmMessage,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Confirm',
                    onPress: () => {
                        setAcceptedUsers((prev) => {
                            const updated = { ...prev };
                            delete updated[user.id];
                            return updated;
                        });

                        setRequests((prev) => prev.filter((u) => u.id !== user.id));

                        setToast(`You cancelled ${user.name}'s request.`);
                    },
                    style: 'destructive',
                },
            ],
            { cancelable: true }
        );
    };

    const handleUndo = () => {
        if (undoUser) {
            setAcceptedUsers((prev) => {
                const updated = { ...prev };
                delete updated[undoUser.id];
                return updated;
            });
            setUndoUser(null);
            setShowUndo(false);
            setToast(`${undoUser.name}'s request has been undone`);
        }
    };

    const handleRequestToggle = (user) => {
        setRequestStatus((prev) => {
            const newStatus = prev[user.id] === 'Requested' ? 'Request' : 'Requested';
            const toastMessage = prev[user.id] === 'Requested'
                ? `Connection request to ${user.name} has been cancelled.`
                : `Connection request has been sent to ${user.name}.`;
            setToast(toastMessage);
            return { ...prev, [user.id]: newStatus };
        });
    };

    const filteredUsers =
        selectedTab === 'Requests'
            ? requests.filter((user) =>
                user.name.toLowerCase().includes(search.toLowerCase())
            )
            : allUsers.filter((user) =>
                user.name.toLowerCase().includes(search.toLowerCase())
            );

    const getCardBackground = (index) => {
        return index % 2 === 0 ? styles.bgLightGreen : styles.bgLightBlue;
    };

    const renderItem = ({ item, index }) => {
        return (
            <View style={[styles.card, getCardBackground(index)]}>
                <View style={styles.circle}>
                    {item.image ? (
                        <Image
                            source={{ uri: item.image }}
                            style={styles.profileImage}
                        />
                    ) : (
                        <Text style={styles.initialsText}>
                            {item.name
                                .split(' ')
                                .map(word => word[0])
                                .join('')
                                .toUpperCase()}
                        </Text>
                    )}
                </View>

                {selectedTab === 'Requests' && acceptedUsers[item.id] ? (
                    <Text style={styles.text}>{item.name} and You are now friends</Text>
                ) : selectedTab === 'Requests' ? (
                    <Text style={styles.text}>
                        {`${item.name} sent you a connection request`}
                    </Text>
                ) : (
                    <Text style={styles.text}>
                        {`Want to connect with ${item.name}`}
                    </Text>
                )}

                <View style={styles.Buttons}>
                    <TouchableOpacity
                        style={[
                            styles.acceptBtn,
                            selectedTab === 'Requests' && acceptedUsers[item.id] && styles.acceptedBtn,
                            selectedTab === 'Connections req. sent' && requestStatus[item.id] === 'Requested' && styles.acceptedBtn,
                        ]}
                        onPress={() =>
                            selectedTab === 'Requests'
                                ? handleAccept(item)
                                : handleRequestToggle(item)
                        }
                    >
                        <Text
                            style={[
                                styles.acceptText,
                                (selectedTab === 'Requests' && acceptedUsers[item.id]) ||
                                    (selectedTab === 'Connections req. sent' && requestStatus[item.id] === 'Requested')
                                    ? styles.acceptedText
                                    : {},
                            ]}
                        >
                            {selectedTab === 'Requests'
                                ? acceptedUsers[item.id]
                                    ? 'Accepted'
                                    : 'Accept'
                                : requestStatus[item.id] === 'Requested'
                                    ? 'Requested'
                                    : 'Request'}
                        </Text>
                    </TouchableOpacity>

                    {selectedTab === 'Requests' && !acceptedUsers[item.id] && (
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => handleCancel(item)}
                        >
                            <Text style={styles.cancelText}>X</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );

    };

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const aStatus = requestStatus[a?.id] || '';
        const bStatus = requestStatus[b?.id] || '';

        const aRequested = aStatus === 'Requested';
        const bRequested = bStatus === 'Requested';

        if (aRequested && !bRequested) { return -1; }
        if (!aRequested && bRequested) { return 1; }
        return 0;
    });

    return (
        <ImageBackground
            source={require('../../assets/app-theme.webp')}
            style={styles.fullFlex}
        >
            <View style={styles.container}>
                <View style={styles.searchContainer}>
                    <View >
                        <TouchableOpacity onPress={() => {navigation.goBack()}}>
                            <Image source={require('../../assets/arrow.jpg')} />
                            {/* <Ionicons name="arrow-back-outline" size={24} color="black" /> */}
                        </TouchableOpacity>
                    </View>
                    <View style={styles.searchBar}>
                        <View style={styles.lens}>
                            {/* <Entypo name="magnifying-glass" size={24} color="black" /> */}
                            <Image source={require('../../assets/magnifying-glass.webp')} />
                        </View>

                        <TextInput
                            placeholder="Search"
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                            placeholderTextColor="#888"
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                {/* <Text style={styles.clearText}><Entypo name="cross" size={24} color="black" /></Text> */}
                                <Text style = {styles.clearText}>X</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                </View>

                <View style={styles.tabs}>
                    {['Requests', 'Connections req. sent'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setSelectedTab(tab)}
                            style={[
                                styles.tab,
                                selectedTab === tab && styles.activeTab,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    selectedTab === tab && styles.activeTabText,
                                ]}
                            >
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <FlatList
                    data={selectedTab === 'Connections req. sent' ? sortedUsers : filteredUsers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />


                {showUndo && (
                    <Animated.View style={[styles.undoContainer, { transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }] }]}>
                        <Text style={styles.undoText}>Accepted {undoUser.name}</Text>
                        <TouchableOpacity onPress={handleUndo}>
                            <Text style={styles.undoButton}>Undo</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}


                {toast !== '' && (
                    <Animated.View
                        style={[
                            styles.toastContainer,
                            { opacity: fadeAnim },
                        ]}
                    >
                        <Text style={styles.toastText}>{toast}</Text>
                    </Animated.View>
                )}
            </View>
        </ImageBackground>
    );
};

export default Connection;

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    fullFlex: {
        flex: 1,
    },

    searchContainer: {
        paddingHorizontal: 15,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 25,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        flex: 1,
        height: 45,
    },

    clearText: {
        color: '#555',
        fontSize: 16,
        marginLeft: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },

    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#000',
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderColor: '#000',
    },
    tabText: {
        color: '#777',
        fontWeight: '400',
        lineHeight: 15,
        letterSpacing: 0,
        fontSize: 14,
    },
    activeTabText: {
        color: '#000',
        fontWeight: 'bold',
    },
    list: {
        paddingBottom: 80,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        height: 72,
        marginBottom: 2,
    },
    circle: {
        width: 35,
        height: 35,
        borderRadius: 20,
        backgroundColor: '#444',
        marginRight: 15,
        marginLeft: 10,
    },
    text: {
        flex: 1,
        fontSize: 14,
        color: '#000',
    },

    Buttons: {
        flexDirection: 'row',
        gap: 2,
    },

    acceptBtn: {
        marginRight: 12,
        height: 25,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'black',
        backgroundColor: 'transparent',
    },

    acceptText: {
        color: 'black',
        fontWeight: '500',
        fontSize: 11,
    },

    acceptedBtn: {
        backgroundColor: '#e2e8f0',
        borderColor: '#cbd5e1',
        borderWidth: 1,
    },

    cancelBtn: {
        height: 25,
        width: 30,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 100,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    cancelText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
        lineHeight: 18,
    },

    acceptedText: {
        color: '#1e293b',
        fontWeight: '500',
    },

    undoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffffee',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 14,
        position: 'absolute',
        bottom: 0,
        width: '100%',
        borderTopWidth: 0.5,
        borderColor: '#ccc',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: -2 },
        shadowRadius: 6,
        elevation: 8,
    },

    undoText: {
        color: '#000',
        fontSize: 14,
    },

    undoButton: {
        color: '#007BFF',
        fontWeight: '600',
        fontSize: 14,
    },

    toastContainer: {
        position: 'absolute',
        bottom: 80,
        left: 20,
        right: 20,
        backgroundColor: '#1e293b',
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 12,
    },

    toastText: {
        color: '#f8fafc',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },

    bgLightGreen: {
        backgroundColor: 'rgba(216, 252, 132, 0.3)',
    },
    bgLightBlue: {
        backgroundColor: 'rgba(126, 139, 255, 0.2)',
    },

    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },

    initialsText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 35,
    },
});
