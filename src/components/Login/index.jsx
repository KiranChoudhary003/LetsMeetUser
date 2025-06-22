import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import logo from '../../assets/logo.png';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = ({ navigation }) => {

    const [error, setError] = useState('');
    const [login, setLogin] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

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
        console.log('Login attempt with:', login)
        try {
            console.log('Sending request to login API...');
            const response = await axios.post(
                'https://letsmeet-backend-47lv.onrender.com/api/user-profile/login',
                login,
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
        }
        finally {
            setLoading(false);
        }
    };

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

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={login.password}
                onChangeText={(text) => setLogin({ ...login, password: text })}
            />
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

                <Text style={styles.forgotPassword}>Forgot password?</Text>
            </View>
            {loading ? (
                <ActivityIndicator size="large" color="#7680DE" />
            ) : (
                <TouchableOpacity style={styles.button} onPress={handleSubmit} >
                    <Text style={styles.buttonText}>Log-in</Text>
                </TouchableOpacity>
            )}
            <View style={styles.signUpSection}>
                <Text style={styles.account}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                    <Text style={styles.signUp}>sign up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

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
        marginTop: 100,
        marginBottom: 30,
    },
    text: {
        fontSize: 35,
        fontWeight: 'bold',
        color: '#34495e',
        marginBottom: 30,
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '75%',
        alignItems: 'center',
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
        color: '#000',
    },
    button: {
        width: 194,
        height: 39,
        backgroundColor: '#34495e',
        borderRadius: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
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
        color: '#777',
        fontSize: 13,
    },
    account: {
        fontSize: 13,
    },
});

export default Login;
