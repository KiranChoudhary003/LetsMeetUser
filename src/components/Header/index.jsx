import React from 'react'
import { Image, StyleSheet } from 'react-native'
import { TouchableOpacity } from 'react-native'
import { View } from 'react-native'
import profile from '../../assets/profile.png'
import scanner from '../../assets/scanner.png'
import connection from '../../assets/connection.png'
import { useNavigation } from '@react-navigation/native'

const Header = () => {

    const navigation = useNavigation()

    const handleQRCode = () => {
        navigation.navigate("QRCode")
    }

    const handleProfile = () => {
        navigation.navigate("UserProfile")
    }

    return (
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
            </View>
        </View>
    )
}

export default Header
const styles = StyleSheet.create({
    customHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#34495e",
        paddingHorizontal: 16,
        paddingVertical: 8,
        width: "100%",
    },

    profile: {
        width: 35,
        height: 35
    },
    headerstyle: {
        width: 45,
        height: 45
    },
})