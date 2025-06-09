import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    ImageBackground,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
} from "react-native";

const backgroundImage = require("../../assets/bgg.png");

const CheckedInDescription = ({ navigation, route }) => {
    const { name, organizer } = route.params

    return (
        <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{name}</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Image source={require("../../assets/poster.png")} style={styles.poster} />
                    <Text style={styles.locationLabel}>📍{organizer}</Text>

                    <Text style={styles.descriptionHeading}>Description</Text>
                    <Text style={styles.descriptionText}>
                        Give me one good reason why I should give up my limited spare time to come to your
                        Science Week event! While you're at it, give me a few good reasons.
                        {"\n\n"}
                        A strong and clear event description excites punters: tell them what will happen at the
                        event, who will be speaking, and what they might get out of attending. Your event may be
                        brilliant, but no one else will know without you telling and convincing them.
                    </Text>

                    {/* Attendance Banner */}
                    <View style={styles.checkedInBanner}>
                        <Text style={styles.checkedInBannerText}>You have attended this event</Text>
                    </View>

                    {/* Stats Section */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Total connection made</Text>
                            <Text style={styles.statNumber}>15</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Requested</Text>
                            <Text style={styles.statNumber}>6</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Accepted</Text>
                            <Text style={styles.statNumber}>9</Text>
                        </View>
                    </View>

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
    backArrow: {
        color: "white",
        fontSize: 24,
        marginRight: 15,
    },
    headerTitle: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    scrollContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    poster: {
        width: "100%",
        height: 400,
        borderRadius: 10,
        marginBottom: 20,
    },
    locationLabel: {
        fontSize: 16,
        marginBottom: 16,
        color: "#000",
    },
    descriptionHeading: {
        fontWeight: "bold",
        fontSize: 20,
        marginBottom: 8,
        color: "#333",
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
        color: "#333",
        marginBottom: 20,
    },
    checkedInBanner: {
        backgroundColor: "#E6FFE6",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignSelf: "center",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#4CAF50",
    },
    checkedInBannerText: {
        color: "#2E7D32",
        fontWeight: "bold",
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 30,
        paddingHorizontal: 5,
    },

    statBox: {
        flex: 1,
        marginHorizontal: 5,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderWidth: 1.5,
        borderColor: "#3A5BFF",  // Changed to a stronger blue
        borderRadius: 12,
        backgroundColor: "transparent",
        alignItems: "center",
    },

    statLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000",
        textAlign: "center",
        marginBottom: 4,
    },

    statNumber: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
    },

});

export default CheckedInDescription;