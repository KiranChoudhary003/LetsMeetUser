import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import logo from '../../assets/logo.png';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Login = ({ navigation, route }) => {
    const { deviceToken } = route.params || {};

    const [error, setError] = useState('');
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
                navigation.navigate('Layout', { screen: 'Home' });
                return;
            }
        };

        checkToken();
    }, []);

    const handleSubmit = async () => {
        setLoading(true);
        console.log('Login attempt with:', login);

        if (!deviceToken) {
            Alert.alert('Missing Device Token', 'Please restart the app and try again.');
            setLoading(false);
            return;
        }

        try {
            console.log('Sending request to login API...');
            console.log("🔐 Sending login payload:", {
                email: login.email,
                password: login.password,
                deviceToken,
            });
            const response = await axios.post(
                'https://letsmeet-backend-47lv.onrender.com/api/user-profile/login',
                {
                    email: login.email,
                    password: login.password,
                    device_token: deviceToken
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                }
            );

            console.log('Login successful, token received:', response.data.token);
            await AsyncStorage.setItem('token', response.data.token);
            console.log('Token saved to AsyncStorage');
            console.log('Device token received:', deviceToken);
            navigation.navigate('Layout', { screen: 'Home' });
        } catch (error) {
            if (error.response) {
                console.log('Server responded with status:', error.response.status);
                console.log('Response data:', error.response.data);
            } else if (error.request) {
                console.log('Request made but no response received:', error.request);
            } else {
                console.log('Something else went wrong:', error.message);
            }
            console.log('Full error:', error);

            setError('Login failed. Check email or password.');
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

        setForgotLoading(true);
        try {
            const response = await axios.post(
                'https://letsmeet-backend-47lv.onrender.com/api/user-profile/forgot-password',
                { email: forgotEmail },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            Alert.alert('Success', 'Password reset link sent to your email.');
            setForgotModalVisible(false);
            setForgotEmail('');
        } catch (err) {
            console.log("Forgot Password Error:", err);
            Alert.alert('Error', 'Failed to send reset link.');
        } finally {
            setForgotLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Image source={logo} style={styles.logo} />
            <Text style={styles.text}>Let's Meet</Text>

            <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                value={login.email}
                onChangeText={(text) => setLogin({ ...login, email: text })}
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
                <View style={styles.checkContainer}>
                    {/* <CheckBox
                        value={agree}
                        onValueChange={setAgree}
                        tintColors={{ true: '#7680DE', false: 'gray' }}
                    /> */}
                    {/* <Text style={styles.remember}>Remember me</Text> */}
                    {/* <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </TouchableOpacity> */}
                </View>

                <TouchableOpacity onPress={() => setForgotModalVisible(true)}>
                    <Text style={styles.forgotPassword}>Forgot password?</Text>
                </TouchableOpacity>

            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#7680DE" />
            ) : (
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Log-in</Text>
                </TouchableOpacity>
            )}

            <View style={styles.signUpSection}>
                <Text style={styles.account}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
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
                            onChangeText={setForgotEmail}
                        />
                        {forgotLoading ? (
                            <ActivityIndicator size="small" color="#7680DE" />
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#e8effc',
        position: 'relative',
    },
    logo: {
        width: 210,
        height: 209,
        resizeMode: 'contain',
        borderRadius: 105,
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
        width: 313,
        height: 43,
        backgroundColor: '#f7faff',
        margin: 10,
        borderRadius: 5,
        paddingHorizontal: 10,
        color: '#000',
        borderColor: '#ccc',
        borderWidth: 1,
    },
    password: {
        width: '75%',
    },
    checkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },

    remember: {
        fontSize: 12,
        color: '#000',
    },
    forgotPassword: {
        fontSize: 13,
        color: '#7f8c8d',
        marginLeft: "60%"
    },
    button: {
        width: 194,
        height: 39,
        backgroundColor: '#34495e',
        borderRadius: 10,
        display: 'flex',
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
        display: 'flex',
        flexDirection: 'row',
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
        width: 313,
        height: 43,
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
        width: '85%',
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
});

export default Login;
