import React, { useEffect, useState } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import profile from '../../assets/profile.png'
import ellipse from '../../assets/Ellipse.png'
import ellipseBottom from '../../assets/EllipseBottom.png'
import ellipseTwo from '../../assets/EllipseTwo.png'
import ellipseBottomTwo from '../../assets/EllipseBottomTwo.png'
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'

const UserProfile = ({ navigation }) => {

    const [userProfile, setUserProfile] = useState({})

    useEffect(() => {
        const fetchProfileData = async () => {
            console.log("User Profile:", userProfile);

            try {
                const token = await AsyncStorage.getItem('token');
                const response = await axios.get(`https://letsmeet-backend-47lv.onrender.com/api/user-profile`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                })
                console.log("Profile Data:", response.data);
                const data = response.data

                setUserProfile(data.user)
            } catch (error) {
                console.error(`Error in fetching: ${error}`);
            } finally {
                setLoading(false);
            }
        }
        fetchProfileData()
    }, [])

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('token')
            navigation.replace('Login')
        } catch (error) {
            console.log(`Error In Logout`)
        }
    }

    return (
        <View style={styles.container}>
            <Image source={ellipse} style={styles.ellipseTop} />
            <Image source={ellipseTwo} style={styles.ellipseTop} />
            <Image source={ellipseBottom} style={styles.ellipseBottom} />
            <Image source={ellipseBottomTwo} style={styles.ellipseBottomTwo} />
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Image
                source={
                    userProfile.photo
                        ? {
                            uri: userProfile.photo.startsWith('http')
                                ? userProfile.photo
                                : `https://letsmeet-backend-47lv.onrender.com/${userProfile.photo}`
                        }
                        : profile // fallback to default image
                }
                style={styles.profile}
            />
            <View style={styles.user}>
                <View style={styles.userDetails}>
                    <Text style={styles.data}>First Name :</Text>
                    <Text style={styles.details}> {userProfile.first_name}</Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={styles.data}>Last Name :</Text>
                    <Text style={styles.details}> {userProfile.last_name}</Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={styles.data}>E-mail :</Text>
                    <Text style={styles.details}> {userProfile.email}</Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={styles.data}>LinkedIn URL :</Text>
                    <Text style={styles.url}> {userProfile.linkedin_url}</Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={styles.data}>Role :</Text>
                    <Text style={styles.details}> {userProfile.attendees_role}</Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={styles.data}>Preferences : </Text>
                    <Text style={styles.details}>
                        {userProfile.preference && userProfile.preference.length > 0
                            ? userProfile.preference.join(', ')
                            : 'None'}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logout}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View >
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        position: 'relative',
    },
    ellipseTop: {
        position: "absolute",
        top: 0,
        left: 0,
    },
    ellipseBottom: {
        position: "absolute",
        bottom: 0,
        right: 0,
    },
    ellipseBottomTwo: {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%"
    },
    profile: {
        width: 139,
        height: 138,
        borderRadius: 69,
        position: "absolute",
        top: 160,
        right: 135
    },
    userDetails: {
        display: 'flex',
        flexDirection: 'row',
        paddingLeft: 30,
        paddingTop: 20
    },
    details: {
        color: "#666"
    },
    url: {
        color: '#465BF3'
    },
    data: {
        fontWeight: 'bold'
    },
    edit: {
        width: 118,
        height: 31,
        backgroundColor: '#465BF3',
        borderRadius: 10,
        color: 'white',
        display: 'flex',
        textAlign: 'center',
        fontSize: 17,
        marginLeft: 60,
        marginTop: 40,
        paddingTop: 3
    },
    botton: {
        flex: 1,
        flexDirection: 'row',
    },
    user: {
        position: 'relative',
        top: 310,
        left: 0
    },
    backArrow: {
        fontSize: 35,
        fontWeight: "bold",
        marginRight: 15,
        marginTop: 30,
    },
    logout : {
        width : 120,
        height : 50,
        backgroundColor : '#7680DE',
        color : "white",
        fontSize : 20,
        borderRadius : 20,
        textAlign : "center",
        paddingTop : 10,
        position : 'sticky',
        left : "37%",
        bottom : -50
    }

})
export default UserProfile