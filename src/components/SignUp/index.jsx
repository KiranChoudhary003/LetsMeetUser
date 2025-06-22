import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image, KeyboardAvoidingView, Alert } from 'react-native';
import { ActivityIndicator, Checkbox, IconButton, Menu, Modal, Provider } from 'react-native-paper';
import { ScrollView } from 'react-native-gesture-handler';
import axios from 'axios';

const SignUp = ({ navigation }) => {
    const [jobRole, setJobRole] = useState('');
    const [visible, setVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [password, setPassword] = useState('');
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [loading, setLoading] = useState(false);

    const toggleRole = (role) => {
        setSelectedRoles((prevSelectedRoles) => {
            if (prevSelectedRoles.includes(role)) {
                return prevSelectedRoles.filter((r) => r !== role);
            } else {
                return [...prevSelectedRoles, role];
            }
        });
    };

    const handleSubmit = async () => {
        setLoading(true);

        if (!firstName || !lastName || !email || !password || !linkedin || !jobRole || selectedRoles.length === 0) {
            Alert.alert('All fields must be filled, including at least one preference.');
            return;
        }

        try {
            const payload = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                password: password,
                linkedin_url: linkedin,
                role_id: typeof jobRole === 'object' ? parseInt(jobRole.id) : parseInt(jobRole),
                attendees_role: typeof jobRole === 'object' ? jobRole.label : jobRole,
                preference: selectedRoles, 
            };
            console.log('Api is fetchinng');
            const response = await fetch('https://letsmeet-backend-47lv.onrender.com/api/user-profile/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            console.log('API successfully fetch');

            const data = await response.json();

            if (response.status === 201) {
                Alert.alert('Successfully Sign Up', 'Redirected into Login Page');
                navigation.navigate('Login');
            } else {
                Alert.alert(data.message || 'Registration failed, please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert('Error', "Couldn't register. Please check your network connection.");
        }
        finally {
            setLoading(false);
        }
    };


    const removeRole = (role) => {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
    };

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                console.log('Api is fetching');
                const response = await axios.get('https://letsmeet-backend-47lv.onrender.com/api/user-profile/roles', {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                console.log('api is successfully fetched');
                if (response.data.roles && Array.isArray(response.data.roles)) {
                    setRoles(response.data.roles);
                }
            } catch (error) {
                console.error('Failed to fetch roles:', error);
            } finally {
                setLoadingRoles(false);
            }
        };

        fetchRoles();
    }, []);

    return (
        <Provider>
            <View style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.text}>Create Account</Text>
                        <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#888" value={firstName} onChangeText={setFirstName} />
                        <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#888" value={lastName} onChangeText={setLastName} />
                        <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#888" value={email} onChangeText={setEmail} />
                        <TextInput style={styles.input} placeholder="Create Password" placeholderTextColor="#888" value={password} onChangeText={setPassword} />
                        <TextInput style={styles.input} placeholder="LinkedIn URL" placeholderTextColor="#888" value={linkedin} onChangeText={setLinkedin} />
                        <Menu
                            visible={visible}
                            onDismiss={() => setVisible(false)}
                            anchor={
                                <TouchableOpacity
                                    onPress={() => setVisible(true)}
                                    style={styles.input}
                                >
                                    <Text style={styles.anchorText}>
                                        {jobRole
                                            ? typeof jobRole === 'string'
                                                ? jobRole
                                                : jobRole.label
                                            : 'Role'}
                                    </Text>
                                </TouchableOpacity>
                            }
                        >
                            {roles.map((role) => (
                                <Menu.Item
                                    key={role}
                                    onPress={() => {
                                        setJobRole(role);
                                        setVisible(false);
                                    }}
                                    title={role}
                                    titleStyle={styles.menuItemTitle} 
                                />
                            ))}
                        </Menu>

                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={styles.anchorText}>Preferences</Text>
                        </TouchableOpacity>

                        <Modal
                            visible={modalVisible}
                            transparent={true}
                            animationType="slide"
                            onRequestClose={() => setModalVisible(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContainer}>
                                    <ScrollView style={{ maxHeight: 250 }}>
                                        {roles.map((role, index) => (
                                            <View key={index} style={styles.checkboxRow}>
                                                <Text style={styles.roleText}>{role}</Text>
                                                <Checkbox.Android
                                                    status={selectedRoles.includes(role) ? 'checked' : 'unchecked'}
                                                    onPress={() => toggleRole(role)}
                                                    color="#37795e"
                                                />
                                            </View>
                                        ))}
                                    </ScrollView>

                                    <TouchableOpacity
                                        style={styles.doneButton}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={{ color: 'white' }}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>

                        <View style={styles.selectedWrapper}>
                            {selectedRoles.map((role, index) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>{role}</Text>
                                    <IconButton
                                        icon={() => (
                                            <Text style={styles.crossIcon}>✕</Text>
                                        )}
                                        onPress={() => removeRole(role)}
                                        style={styles.closeIcon}
                                    />

                                </View>
                            ))}
                        </View>
                        {loading ? (
                            <ActivityIndicator size="large" color="#7680DE" />
                        ) : (
                            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                                <Text style={styles.buttonText}>Sign-in</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.condition}>
                            <Text style={styles.agree}>By continuing you agree to all </Text>
                            <Text style={styles.terms}>terms, condition </Text>
                        </View>
                        <View style={styles.privacy}>
                            <Text style={styles.and}>& </Text>
                            <Text style={styles.policy}>privacy policy</Text>
                        </View>
                        <View style={styles.account}>
                            <Text style={styles.already}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.login}>log-in</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8effc',
    },
    inputContainer: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 50,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 50,
        color: '#34495e',
        textAlign: 'center',
        paddingTop: 50,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 25,
        marginLeft: 50,
        width: 313,
        height: 43,
        backgroundColor: '#f7faff',
    },
    anchorText: {
        color: '#888',
    },
    menuItemTitle: {
        color: '#fff',
    },
    modalOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '85%',
        maxHeight: '50%',
        padding: 20,
        elevation: 5,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    roleText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    doneButton: {
        backgroundColor: '#34495e',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    doneText: {
        color: 'white',
        fontSize: 14,
    },
    selectedWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    tag: {
        backgroundColor: '#ddd',
        paddingHorizontal: 8,
        borderRadius: 12,
        marginRight: 5,
        marginBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        maxWidth: '30%',
        height: 20,
    },
    tagText: {
        marginRight: 8,
    },
    crossIcon: {
        fontSize: 12,
        color: '#888',
    },

    button: {
        backgroundColor: '#34495e',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginLeft: 110,
        width: 194,
        height: 39,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    condition: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
    },
    agree: {
        fontSize: 13,
        color: '#7f8c8d',
    },
    terms: {
        fontSize: 13,
        color: '#7680DE',
        fontWeight: '500',
    },
    privacy: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 4,
    },
    and: {
        fontSize: 13,
        color: '#7f8c8d',
    },
    policy: {
        fontSize: 13,
        color: '#7680DE',
        fontWeight: '500',
    },
    account: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    already: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    login: {
        fontSize: 14,
        color: '#34495e',
        fontWeight: '700',
        marginLeft: 4,
    },
});

export default SignUp;
