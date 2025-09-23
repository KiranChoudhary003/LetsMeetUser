import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@react-native-community/blur';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useColorScheme,
    View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import validator from 'validator';
import logo from '../../assets/logo.png';

const { width } = Dimensions.get('window');
const INPUT_WIDTH = width * 0.85;

const Login = ({ navigation, route }) => {
    const { deviceToken } = route.params || {};
    const [login, setLogin] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [forgotModalVisible, setForgotModalVisible] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [alertModalVisible, setalertModalVisible] = useState(false);
    const [alertMessage, setalertMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [retryCountdown, setRetryCountdown] = useState(0);
    const [isRetryLocked, setIsRetryLocked] = useState(false);
    const retryIntervalRef = useRef(null);


    const handleRateLimit = async (seconds) => {
        const unlockAt = Date.now() + seconds * 1000;
        await AsyncStorage.setItem('retryUntil', unlockAt.toString());
        setRetryCountdown(seconds);
        setIsRetryLocked(true);
        setalertModalVisible(true);
        if (retryIntervalRef.current) { clearInterval(retryIntervalRef.current); }

        retryIntervalRef.current = setInterval(() => {
            setRetryCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(retryIntervalRef.current);
                    retryIntervalRef.current = null;
                    AsyncStorage.removeItem('retryUntil');
                    setIsRetryLocked(false);
                    setalertModalVisible(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        const startCountdown = async () => {
            const retryUntil = await AsyncStorage.getItem('retryUntil');
            const now = Date.now();

            if (retryUntil && parseInt(retryUntil, 10) > now) {
                const remaining = Math.ceil((parseInt(retryUntil, 10) - now) / 1000);
                await handleRateLimit(remaining);
            }
        };

        startCountdown();

        return () => {
            if (retryIntervalRef.current) {
                clearInterval(retryIntervalRef.current);
            }
        };
    }, []);


    const handleSubmit = async () => {
        if (!login.email.trim() || !login.password.trim()) {
            setalertMessage('Both email and password are required.');
            setalertModalVisible(true);
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${BASE_URL}/api/user-profile/login`,
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

            const token = response.data.token;
            await AsyncStorage.setItem('token', token);
            navigation.replace('Layout', { screen: 'Home' });
            setLogin({ email: '', password: '' });
        } catch (error) {
            let message = 'Server error';

            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                switch (status) {
                    case 401:
                        if (data.attemptsLeft === 0) {
                            await handleRateLimit(data.retryAfterSeconds);
                            return;
                        } else {
                            message = `Invalid credentials. ${data.attemptsLeft} attempts left.`;
                        }
                        break;
                    case 403:
                        message = data.message || 'Access denied.';
                        break;
                    case 429:
                        await handleRateLimit(data.retryAfterSeconds);
                        return;
                    case 500:
                        message = 'Server error';
                        break;
                    default:
                        message = data.message || 'Login failed';
                }
            } else {
                message = 'Network error. Please check your internet connection.';
            }

            setalertMessage(message);
            setalertModalVisible(true);
        } finally {
            setLoading(false);
        }
    };


    const validateEmail = (emailToValidate) => {
        if (!emailToValidate.trim()) {
            return 'Email is required';
        }

        const trimmedEmail = emailToValidate.trim().toLowerCase();

        if (trimmedEmail.length > 254) {
            return 'Email address is too long';
        }

        if (/[^a-zA-Z0-9@._-]/.test(trimmedEmail)) {
            return 'Email contains invalid characters';
        }

        if (trimmedEmail.includes('..')) {
            return 'Please enter a valid email address';
        }

        if (!validator.isEmail(trimmedEmail)) {
            return 'Please enter a valid email address';
        }

        return true;
    };


    const handleForgotPassword = async () => {

        const emailValidationResult = validateEmail(forgotEmail);
        if (emailValidationResult !== true) {
            setalertMessage(emailValidationResult);
            setalertModalVisible(true);
            return;
        }

        setForgotLoading(true);
        try {
            await axios.post(
                `${BASE_URL}/api/user-profile/forgot-password`,
                { email: forgotEmail.toLowerCase() },
                { headers: { 'Content-Type': 'application/json' } }
            );

            setalertMessage('Password reset link sent to your email.');
            setalertModalVisible(true);
            setForgotModalVisible(false);
            setForgotEmail('');
        } catch (error) {
            setalertMessage('No account found with this email.');
            setalertModalVisible(true);
        } finally {
            setForgotLoading(false);
        }
    };


    return (
        <>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="dark-content"
            />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={styles.inner}>
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
                            }
                        />

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
                            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isRetryLocked}>
                                <Text style={styles.buttonText}>Log In</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.signUpSection}>
                            <Text style={styles.account}>Don't have an account?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('SignUp', { deviceToken })}>
                                <Text style={styles.signUp}>Sign Up</Text>
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
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                    </ScrollView>
                </TouchableWithoutFeedback>

                <View style={styles.contactContainer}>
                    <Text style={styles.contactText}>
                        Having trouble?
                        <Text
                            style={styles.contactLink}
                            onPress={() =>
                                Linking.openURL(
                                    'mailto:support@zordial.com?subject=Login Issue'
                                )
                            }
                        >
                            {' '}Contact Us
                        </Text>
                    </Text>
                </View>

                <Modal
                    animationType="fade"
                    transparent
                    visible={alertModalVisible}
                    onRequestClose={() => {
                        if (!isRetryLocked) { setalertModalVisible(false); }
                    }}
                >
                    <View style={styles.modalContainer}>
                        {isRetryLocked && (
                            <BlurView
                                style={StyleSheet.absoluteFill}
                                blurType="light"
                                blurAmount={4}
                                reducedTransparencyFallbackColor="white"
                            />
                        )}
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>Message</Text>
                            <Text style={styles.modalMessage}>
                                {isRetryLocked
                                    ? `Please wait ${retryCountdown} seconds before trying again.`
                                    : alertMessage}
                            </Text>
                            {!isRetryLocked && (
                                <TouchableOpacity style={styles.button} onPress={() => setalertModalVisible(false)}>
                                    <Text style={styles.buttonText}>OK</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Modal>
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
        color: '#000',
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
        paddingHorizontal: 5,
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
    modalMessage: {
        fontSize: 15,
        color: '#34495e',
        textAlign: 'center',
        marginBottom: 10,
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
    cancelText: {
        marginTop: 10,
        color: 'gray',
    },
    requestModalOverlay: {
        flex: 1,
        backgroundColor: '#00000088',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    requestModalWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requestModalContainer: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 1000,
    },
    requestModalTitle: {
        color: '#333',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    requestModalMessage: {
        color: '#555',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    requestProgressBarContainer: {
        height: 10,
        backgroundColor: '#e0e0e0',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 15,
    },
    requestProgressBarFill: {
        height: '100%',
        backgroundColor: '#34495e',
    },
    requestModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    requestModalButton: {
        width: '40%',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    requestAcceptBtn: {
        backgroundColor: '#34495e',
    },
    requestDeclineBtn: {
        backgroundColor: '#F44336',
    },
    requestModalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },

});

export default Login;
