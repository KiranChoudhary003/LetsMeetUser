import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    Platform,
    Linking,
    StatusBar,
    Dimensions,
} from 'react-native';
import logo from '../../assets/logo.png';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { connectSocket } from '../../socket';

const { width } = Dimensions.get('window');
const INPUT_WIDTH = width * 0.85;

const Login = ({ navigation, route }) => {

    const { deviceToken } = route.params || {};

    const [login, setLogin] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [forgotModalVisible, setForgotModalVisible] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const checkToken = async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                navigation.replace('Layout', { screen: 'Home' });
            }
        };
        checkToken();
    }, []);

    const handleSubmit = async () => {
    setLoading(true);

    try {
        const response = await axios.post(
            'https://letsmeet-backend-47lv.onrender.com/api/user-profile/login',
            {
                email: login.email,
                password: login.password,
                device_token: deviceToken ?? '',
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            }
        );

        // ✅ Save token
        await AsyncStorage.setItem('token', response.data.token);

        // ✅ Connect socket
        await connectSocket();

        // ✅ Navigate after socket connection
        navigation.replace('Layout', { screen: 'Home' });

    } catch (error) {
        Alert.alert('Error', 'Login failed. Check email or password');
    } finally {
        setLoading(false);
    }
};


    const handleForgotPassword = async () => {
        if (!forgotEmail) {
            Alert.alert('Error', 'Please enter your email.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(forgotEmail.toLowerCase())) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        setForgotLoading(true);
        try {
            await axios.post(
                'https://letsmeet-backend-47lv.onrender.com/api/user-profile/forgot-password',
                { email: forgotEmail.toLowerCase() },
                { headers: { 'Content-Type': 'application/json' } }
            );

            Alert.alert('Success', 'Password reset link sent to your email.');
            setForgotModalVisible(false);
            setForgotEmail('');
        } catch (error) {
            Alert.alert('Error', 'No account found with this email.');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#34495e" translucent={false} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.inner}>
                        <Image source={logo} style={styles.logo} />
                        <Text style={styles.text}>Let's Meet</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="E-mail"
                            placeholderTextColor="#888"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={login.email}
                            onChangeText={(text) =>
                                setLogin({ ...login, email: text.toLowerCase() })
                            } />

                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Password"
                                placeholderTextColor="#888"
                                secureTextEntry={!showPassword}
                                value={login.password}
                                onChangeText={(text) => setLogin({ ...login, password: text })}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <MaterialIcons
                                    name={showPassword ? 'visibility-off' : 'visibility'}
                                    size={22}
                                    color="#888"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.password}>
                            <TouchableOpacity onPress={() => setForgotModalVisible(true)}>
                                <Text style={styles.forgotPassword}>Forgot password?</Text>
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <ActivityIndicator size="large" color="#34495e" />
                        ) : (
                            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                                <Text style={styles.buttonText}>Log-in</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.signUpSection}>
                            <Text style={styles.account}>Don't have an account?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('SignUp', { deviceToken })}>
                                <Text style={styles.signUp}>sign up</Text>
                            </TouchableOpacity>
                        </View>

                        <Modal
                            animationType="slide"
                            transparent
                            visible={forgotModalVisible}
                            onRequestClose={() => setForgotModalVisible(false)}
                        >
                            <View style={styles.modalContainer}>
                                <View style={styles.modalBox}>
                                    <Text style={styles.modalTitle}>Reset Password</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#888"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={forgotEmail}
                                        onChangeText={(text) => setForgotEmail(text.toLowerCase())}
                                    />
                                    {forgotLoading ? (
                                        <ActivityIndicator size="small" color="#34495e" />
                                    ) : (
                                        <TouchableOpacity style={styles.button} onPress={handleForgotPassword}>
                                            <Text style={styles.buttonText}>Submit</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={() => setForgotModalVisible(false)}>
                                        <Text style={{ marginTop: 10, color: 'gray' }}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                    </View>
                </TouchableWithoutFeedback>

                <View style={styles.contactContainer}>
                    <Text style={styles.contactText}>
                        Having trouble?
                        <Text
                            style={styles.contactLink}
                            onPress={() =>
                                Linking.openURL(
                                    'mailto:kiranchoudhary9180@gmail.com?subject=Login Issue'
                                )
                            }
                        >
                            {' '}Contact Us
                        </Text>
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8effc',
        justifyContent: 'space-between',
    },
    inner: {
        alignItems: 'center',
    },
    logo: {
        width: width * 0.55,
        height: width * 0.55,
        resizeMode: 'contain',
        borderRadius: (width * 0.55) / 2,
        marginTop: 80,
        marginBottom: 30,
    },
    text: {
        fontSize: 35,
        fontWeight: 'bold',
        color: '#34495e',
        marginBottom: 10,
    },
    input: {
        width: INPUT_WIDTH,
        height: 45,
        backgroundColor: '#f7faff',
        margin: 10,
        borderRadius: 5,
        paddingHorizontal: 10,
        color: '#000',
        borderColor: '#ccc',
        borderWidth: 1,
    },
    password: {
        width: '100%',
    },
    forgotPassword: {
        fontSize: 13,
        color: '#7f8c8d',
        marginLeft: '60%',
    },
    button: {
        width: width * 0.5,
        height: 45,
        backgroundColor: '#34495e',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    buttonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    signUpSection: {
        marginTop: 10,
        flexDirection: 'row',
        color: "#000"
    },
    signUp: {
        fontSize: 14,
        color: '#34495e',
        fontWeight: '700',
        marginLeft: 4,
    },
    account: {
        fontSize: 13,
        color: '#7f8c8d',
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: INPUT_WIDTH,
        height: 45,
        backgroundColor: '#f7faff',
        margin: 10,
        borderRadius: 5,
        paddingHorizontal: 10,
        borderColor: '#ccc',
        borderWidth: 1,
    },
    passwordInput: {
        flex: 1,
        color: '#000',
    },
    eyeIcon: {
        paddingHorizontal: 5,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        width: '90%',
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        elevation: 5,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 12,
        fontWeight: 'bold',
        color: '#34495e',
    },
    contactContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    contactText: {
        color: '#555',
        fontSize: 14,
    },
    contactLink: {
        color: '#7680DE',
        fontWeight: 'bold',
    },
});

export default Login;
