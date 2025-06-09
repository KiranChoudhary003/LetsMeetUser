import React, { useRef, useState, useEffect, useContext } from "react";
import { Easing, ToastAndroid, Modal, Image } from "react-native";

import {
    ScrollView,
    Text,
    View,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    StyleSheet,
    ImageBackground,
    Animated,
    Pressable,
} from "react-native";
import profile from '../../assets/profile.png'
import scanner from '../../assets/scanner.png'
import connection from '../../assets/connection.png'
import chat from '../../assets/chat.png'
import { LocationContext } from "../LocationContext/LocationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const backgroundImage = require("../../assets/bgg.png");

const Card = ({ children, style }) => (
    <View style={[styles.card, style]}>{children}</View>
);

const Button = ({ children, onPress, variant }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.button,
                variant === "ghost" ? styles.ghostButton : styles.filledButton,
            ]}
        >
            <Text
                style={[
                    styles.buttonText,
                    variant === "ghost" ? styles.ghostText : styles.filledText,
                ]}
            >
                {children}
            </Text>
        </TouchableOpacity>
    );
};


const EventCard = ({ name, organizer, date, onPress, lat, lon }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const [withinRange, setWithinRange] = useState(false);
    const [checkedIn, setCheckedIn] = useState(false);
    const [registered, setRegistered] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowWelcome(false);
        }, 2800);

        return () => clearTimeout(timer);
    }, []);

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const checkProximity = () => {
        const userLat = 26.9124;
        const userLon = 75.7873;
        const distance = calculateDistance(userLat, userLon, lat, lon);
        setWithinRange(true);  // Allow check-in only if distance <= 1km
    };

    useEffect(() => {
        checkProximity();
    }, []);

    return (
        <>
            {showWelcome && (
                <Modal transparent animationType="fade" visible={showWelcome}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalText}>🎉 Welcome to Events!</Text>
                            <Text style={styles.modalSubText}>Let’s attend events and make connections!</Text>
                        </View>
                    </View>
                </Modal>
            )}

            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}  // 🔥 Add this line
            >
                <Animated.View style={[
                    styles.card,
                    { transform: [{ scale }], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
                ]}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.eventName}>{name}</Text>
                        <Text style={styles.eventOrganizer}>{organizer}</Text>
                        <Text style={styles.eventDate}>{new Date(date).toLocaleDateString()}</Text>
                    </View>

                    <View>
                        {checkedIn ? (
                            <View style={{
                                backgroundColor: '#4CAF50',
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>✔ Checked</Text>
                            </View>
                        ) : registered ? (
                            <TouchableOpacity
                                onPress={() => {
                                    if (withinRange) {
                                        setCheckedIn(true);
                                        ToastAndroid.show("Checked-In Successfully!", ToastAndroid.SHORT);
                                    } else {
                                        ToastAndroid.show("You are not within range to check-in!", ToastAndroid.SHORT);
                                    }
                                }}
                                style={{
                                    backgroundColor: withinRange ? '#4CAF50' : '#aaa',
                                    paddingHorizontal: 18,
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Check-In</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={() => {
                                    setRegistered(true);
                                    ToastAndroid.show("Registered Successfully!", ToastAndroid.SHORT);
                                }}
                                style={{
                                    backgroundColor: 'transparent',
                                    borderWidth: 1,
                                    borderColor: '#1E88E5',
                                    paddingHorizontal: 18,
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    //borderRadius:50,
                                    justifyContent: 'center'
                                }}
                            >
                                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 12 }}>Register</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </Pressable>
        </>
    );
}

const groupEventsByMonth = (events) => {
    const grouped = events.reduce((acc, event) => {
        const eventDate = new Date(event.date);
        const year = eventDate.getFullYear();
        const monthNumber = eventDate.getMonth(); // 0 = January
        const monthName = eventDate.toLocaleString("default", { month: "long" });

        const key = `${year}-${monthNumber}`;  // For accurate sorting.
        if (!acc[key]) {
            acc[key] = {
                monthName,
                year,
                events: [],
                monthNumber
            };
        }
        acc[key].events.push(event);
        return acc;
    }, {});

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        const [yearA, monthA] = a.split("-").map(Number);
        const [yearB, monthB] = b.split("-").map(Number);
        if (yearA === yearB) return monthA - monthB;
        return yearA - yearB;
    });

    // Build the final object
    const result = {};

    if (grouped[currentMonthKey]) {
        result[currentMonthKey] = grouped[currentMonthKey];
    }

    sortedKeys.forEach((key) => {
        if (key !== currentMonthKey) {
            result[key] = grouped[key];
        }
    });

    return result;
};

const Home = ({ navigation }) => {

    const [eventData, setEventData] = useState([])

    const { location } = useContext(LocationContext);

    const fetchUpcomingEvents = async () => {
        try {
            const token = await AsyncStorage.getItem('token'); // replace with your auth method
            if (!location?.latitude || !location?.longitude) {
                console.warn("Location not available yet");
                return;
            }

            console.log("Api is fetching")
            const response = await axios.post(
                'https://letsmeet-backend-47lv.onrender.com/api/user-events/upcoming-events', // ✅ Replace with your API URL
                {
                    latitude: location.latitude,
                    longitude: location.longitude
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log("Api is fetched")

            const rawEvents = response.data.events;

            // 🔁 Map the response to your expected format
            const formattedEvents = rawEvents.map(event => ({
                name: event.name,
                organizer: event.venue || 'Unknown',
                date: event.start_date_time,
                lat: parseFloat(event.latitude),
                lon: parseFloat(event.longitude),
            }));

            setEventData(formattedEvents);
        } catch (error) {
            console.error('Error fetching events:', error.message || error);
        }
    };

    useEffect(() => {
        if (location?.latitude && location?.longitude) {
            fetchUpcomingEvents();
        }
    }, [location]);

    const handleQRCode = () => {
        navigation.navigate("QRCode")
    }

    const handleProfile = () => {
        navigation.navigate("UserProfile")
    }

    // const eventData = [
    //     { name: "Tech Fest", organizer: "GIT,jaipur", date: "2024-05-13", lat: 50.9124, lon: 75.7873 },
    //     { name: "AI Summit", organizer: "codefiesta", date: "2024-04-12", lat: 26.9124, lon: 75.7873 },
    //     { name: "Tech Fest2", organizer: "GIT,jai   pur2", date: "2024-05-13", lat: 26.9124, lon: 75.7873 },
    //     { name: "AI Summit2", organizer: "codefiesta2", date: "2024-04-12", lat: 26.9124, lon: 75.7873 },
    //     { name: "Tech Fest3", organizer: "GIT,jaipur3", date: "2024-05-13", lat: 50.9124, lon: 75.7873 },
    //     { name: "AI Summit3", organizer: "codefiesta3", date: "2024-04-12", lat: 26.9124, lon: 75.7873 },
    //     { name: "Tech Fest4", organizer: "GIT,jaipur4", date: "2024-05-13", lat: 26.9124, lon: 75.7873 },
    //     { name: "AI Summit4", organizer: "codefiesta4", date: "2024-04-12", lat: 26.9124, lon: 75.7873 }

    // ];

    const events = groupEventsByMonth(eventData);
    const animatedPosition = useRef(new Animated.Value(0)).current;

    const moveToLeft = () => {
        Animated.timing(animatedPosition, {

            toValue: -120, // move farther left
            duration: 500, // longer = smoother
            easing: Easing.out(Easing.exp), // smooth easing
            useNativeDriver: true,
        }).start();
    };

    const moveToRight = () => {
        Animated.timing(animatedPosition, {
            toValue: 120, // move farther right
            duration: 500,
            easing: Easing.out(Easing.exp), // smooth easing
            useNativeDriver: true,
        }).start();
    };


    return (
        <View style={styles.background} resizeMode="cover">
            <SafeAreaView style={styles.container}>
                <View style={styles.customHeader}>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity onPress={() => { handleProfile() }}>
                            <Image source={profile} style={styles.profile} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { handleQRCode() }}>
                            <Image source={scanner} style={styles.headerstyle} />
                        </TouchableOpacity>
                    </View>


                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={() => { navigation.navigate('Connection') }}>
                            <Image source={connection} style={styles.headerstyle} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => console.log("d pressed")}>
                            <Image source={chat} style={styles.headerstyle} />
                        </TouchableOpacity>
                    </View>
                </View>

                <StatusBar barStyle="dark-content" />

                <ScrollView contentContainerStyle={styles.scrollView}>
                    <View style={styles.header}>
                        <View style={styles.eventsLabel}>
                            <Text style={styles.eventsLabelText}>Events for you</Text>
                        </View>
                        <Text style={styles.checkInNote}>
                            * For check-in, you must be within 500m of the selected event.
                        </Text>
                    </View>

                    {Object.entries(events).map(([month, data]) => (
                        <View key={month} style={styles.monthSection}>
                            <Text style={styles.monthTitle}>{`${data.monthName} ${data.year}`}</Text>

                            {data.events.map((event, index) => (
                                <EventCard
                                    key={`${month}-${index}`}
                                    name={event.name}
                                    organizer={event.organizer}
                                    date={event.date} // 👈 Pass raw date, let EventCard format it
                                    onPress={() =>
                                        navigation.navigate("Description", {
                                            name: event.name,
                                            organizer: event.organizer,
                                            date: new Date(event.date).toLocaleDateString(), // 👈 format here for display
                                        })
                                    }
                                />
                            ))}
                        </View>
                    ))}

                </ScrollView>
            </SafeAreaView>
            <View style={styles.bottomBarContainer}>
                <TouchableOpacity onPress={moveToLeft}>
                    <Text style={styles.bottomIconleft}>📅</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { navigation.navigate('MyEvents') }}>
                    <Text style={styles.bottomIconright}>👤</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
        resizeMode: "cover",
        backgroundColor: "rgb(227, 235, 250)",
    },
    scrollView: {
        padding: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)', // Semi-transparent black background
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#ffffffee', // Slight transparency
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '70%',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    modalSubText: {
        fontSize: 14,
        color: '#555',
        marginTop: 10,
        textAlign: 'center',
    },

    modalText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    customHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#6C7C7C", // match your screenshot color
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },

    headerRight: {
        flexDirection: "row",
        gap: 20,
    },

    profile: {
        width: 35,
        height: 35
    },
    headerstyle: {
        width: 45,
        height: 45
    },
    eventsLabel: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        width: 156,
        height: 41,
        marginLeft: 100,
        borderWidth: 1,
        borderColor: "#888",
        borderRadius: 20,
        backgroundColor: "rgb(201, 194, 241)",
        alignSelf: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    eventsLabelText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    button: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    filledButton: {
        backgroundColor: "#4F46E5S",
    },
    ghostButton: {
        backgroundColor: "transparent",
    },
    buttonText: {
        fontSize: 14,
    },
    filledText: {
        color: "#fff",
    },
    ghostText: {
        color: "#000",
    },
    monthSection: {
        marginBottom: 24,
    },
    monthTitle: {
        fontSize: 25,
        fontWeight: "bold",
        fontStyle: "italic",
        color: "#333",
        marginBottom: 8,
    },
    card: {
        backgroundColor: "rgb(201, 194, 241)",
        padding: 16,
        width: 370,
        height: 90,
        marginVertical: 6,
        borderRadius: 16,

        // Android
        elevation: 6,

        // iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    eventName: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
        color: "#111",
    },
    eventOrganizer: {
        fontSize: 12,
        color: "#555",
        marginBottom: 4,
    },
    eventDate: {
        fontSize: 12,

        color: "#555",
        alignSelf: 'flex-start',
        marginTop: 3,
    },
    bottomBarContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: "#465E5D",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingHorizontal: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: "visible",
    },

    centerCircle: {
        position: "absolute",
        top: -25,
        left: "50%",
        right: "100%",
        marginLeft: -3, // half of width to center properly
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#465E5D",
        alignItems: "center",
        justifyContent: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },

    bottomIcon: {
        fontSize: 24,

        color: "white",
    },
    bottomIconleft:
    {
        fontSize: 24,
        left: -20,
        color: "white",
    },
    bottomIconright:
    {
        fontSize: 24,
        right: -25,
        color: "white",
    },
    checkInNote: {
        fontSize: 10,
        color: '#333',
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // Semi-transparent white
        padding: 10,
        borderRadius: 10,
        marginVertical: 10,
        marginHorizontal: 6,
        textAlign: 'center',
        fontWeight: '500',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginLeft: -320,
        marginBottom: -50,
        elevation: 3, // Android shadow
    },
});

export default Home;