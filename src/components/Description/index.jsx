import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    ImageBackground,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    ToastAndroid,
} from "react-native";

const backgroundImage = require("../../assets/bgg.png");

const Description = ({ navigation, route}) => {
    const {name, organizer} = route.params

    console.log("Route params:", route.params);

    const [buttonState, setButtonState] = useState("register"); // register, checkin, checkedin
    const [isInRange, setIsInRange] = useState(false); // false = out of range, true = within 500m
    const [isLoading, setIsLoading] = useState(false); // Loading spinner state

    // Simulate entering range (static for demo)
    React.useEffect(() => {
        const timer = setTimeout(() => setIsInRange(true), 2000);  // Auto "enter range" after 2 sec
        return () => clearTimeout(timer);
    }, []);

    const handlePress = () => {
        if (isLoading) return; // prevent double tap

        if (buttonState === "register") {
            if (buttonState === "register") {
                setIsLoading(true);
                setTimeout(() => {
                    setIsLoading(false);
                    setButtonState("checkin");
                    setIsInRange(false);  // Simulate user now being in range
                    ToastAndroid.show("Registered successfully!", ToastAndroid.SHORT);
                }, 1000);}
        } else if (buttonState === "checkin") {
            if (!isInRange) {
                ToastAndroid.show("You are unable to check in", ToastAndroid.SHORT);
            } else {
                setIsLoading(true);
                setTimeout(() => {
                    setButtonState("checkedin");
                    setIsLoading(false);
                    ToastAndroid.show("You are successfully checked in", ToastAndroid.SHORT);
                }, 1500);
            }
        }
    };

    return (
        <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}> {name}</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Image source={require("../../assets/poster.png")} style={styles.poster} />

                    <Text style={styles.locationLabel}>📍 {organizer}</Text>

                    <Text style={styles.descriptionHeading}>Description</Text>
                    <Text style={styles.descriptionText}>
                        Give me one good reason why I should give up my limited spare time to come to your Science Week event!
                        While you're at it, give me a few good reasons.
                        A strong and clear event description excites punters: tell them what will happen at the event,
                        who will be speaking, and what they might get out of attending.
                        Give me one good reason why I should give up my limited spare time to come to your Science Week event!
                        While you're at it, give me a few good reasons.
                        A strong and clear event description excites punters: tell them what will happen at the event,
                        who will be speaking, and what they might get out of attending.
                        who will be speaking, and what they might get out of attending.
                        Give me one good reason why I should give up my limited spare time to come to your Science Week event!
                        While you're at it, give me a few good reasons.
                        A strong and clear event description excites punters: tell them what will happen at the event,
                        who will be speaking, and what they might get out of attending.
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.attendButton,
                            {
                                backgroundColor:
                                    buttonState === "checkedin"
                                        ? "transparent"
                                        : buttonState === "checkin"
                                        ? isInRange
                                            ? "#4CAF50"
                                            : "grey"
                                        : "white",
                                borderColor: buttonState === "checkedin" ? "transparent" : "#000000",
                            },
                        ]}
                        onPress={handlePress}
                        disabled={isLoading} // Disable while loading
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#0000ff" />
                        ) : buttonState === "checkedin" ? (
                            <View style={styles.tickWrapper}>
                            <Text style={styles.tickText}>✅</Text>
                            </View>
                        ) : (
                            <Text
                                style={[
                                    styles.attendButtonText,
                                    {
                                        color:
                                            buttonState === "checkin" && !isInRange
                                                ? "white"
                                                : buttonState === "checkin"
                                                ? "white"
                                                : "black",
                                    },
                                ]}
                            >
                                {buttonState === "register"
                                    ? "Register"
                                    : buttonState === "checkin"
                                    ? "Check-In"
                                    : ""}
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },
    background: {
        flex: 1,
        resizeMode: "cover",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        backgroundColor: "#3A486E",
    },
    backArrow: { color: "white", fontSize: 24, marginRight: 15 },
    headerTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
    scrollContainer: { padding: 16 },
    poster: { width: "100%", height: 400, borderRadius: 10, marginBottom: 20 },
    locationLabel: { fontSize: 16, marginBottom: 10, color: "#000000" },
    descriptionHeading: { fontWeight: "bold", fontSize: 20, marginBottom: 8, color: "#333" },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
        color: "#333",
        marginBottom: 20,
    },
    attendButton: {
        alignSelf: "center",
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    attendButtonText: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#000000",
    },
    tickWrapper: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 5,
    },
    tickText: {
        fontSize: 26,
        color:"green",
        textAlign: "center",
    },
    
});

export default Description;

// import React from 'react'
// import { Text, View } from 'react-native'

// const Description = () => {
//   return (
//     <View>
//         <Text>Hello</Text>
//     </View>
//   )
// }

// export default Description