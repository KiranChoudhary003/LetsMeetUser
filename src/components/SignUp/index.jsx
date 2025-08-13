/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View,KeyboardAvoidingView, StatusBar, Platform, Modal as RNModal } from 'react-native';
import { ActivityIndicator, Checkbox,Menu, Modal, Provider } from 'react-native-paper';
import { ScrollView } from 'react-native-gesture-handler';
import axios from 'axios';

const SignUp = ({ navigation, route }) => {
    const { deviceToken } = route.params || {};

    const [jobRole, setJobRole] = useState('');
    const [visible, setVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [fullName, setFullName] = React.useState('');
    const [firstName, setFirstName] = React.useState('');
    const [middleName, setMiddleName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [email, setEmail] = useState('');
    const linkedInPrefix = 'https://www.linkedin.com/in/';
    const [linkedInUsername, setLinkedInUsername] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [loading, setLoading] = useState(false);
    const [policyModalVisible, setPolicyModalVisible] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [anchorLayout, setAnchorLayout] = useState(null);
    const [inputWidth, setInputWidth] = useState(0);
    const [privacyPolicy, setPrivacyPolicy] = useState('');
    const [alertModalVisible, setalertModalVisible] = useState(false);
    const [alertMessage, setalertMessage] = useState('');
    const [alertAction, setAlertAction] = useState(null);

    const roleRef = useRef(null);

    const toggleRole = (role) => {
        setSelectedRoles((prevSelectedRoles) => {
            if (prevSelectedRoles.includes(role)) {
                return prevSelectedRoles.filter((r) => r !== role);
            } else {
                return [...prevSelectedRoles, role];
            }
        });
    };

    const onFullNameChange = (text) => {
        setFullName(text);

        const parts = text.trim().split(/\s+/);

        setFirstName(parts[0] || '');
        setMiddleName(parts[1] || '');

        if (parts.length > 2) {
            setLastName(parts.slice(2).join(' '));
        } else {
            setLastName('');
        }
    };

    const handleSubmit = async () => {
        const showError = (message) => {
            setErrorMessage(message);
            setErrorModalVisible(true);
        };

        const validateFields = () => {
            if (!fullName.trim()) {
                showError('Full Name is required');
                return false;
            }

            if (!email.trim()) {
                showError('Email is required');
                return false;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                showError('Please enter a valid email address');
                return false;
            }

            if (!password.trim()) {
                showError('Password is required');
                return false;
            }
            const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
            if (!passwordRegex.test(password.trim())) {
                showError('Password must be at least 8 characters long and include at least one special character.');
                return false;
            }
            if (!linkedInUsername) {
                showError('Please enter your LinkedIn username.');
                return false;
            }

            const fullLinkedInURL = linkedInPrefix + linkedInUsername;
            if (!/^https:\/\/www\.linkedin\.com\/in\/[A-Za-z0-9-_.]+$/.test(fullLinkedInURL)) {
                showError('Invalid LinkedIn username format.');
                return false;
            }
            if (!jobRole) {
                showError('Role is required');
                return false;
            }
            if (!selectedRoles || selectedRoles.length === 0) {
                showError('Please select at least one preference');
                return false;
            }
            return true;
        };

        if (!validateFields()) {
            return;
        }

        setLoading(true);

        try {
            const payload = {
                first_name: firstName.trim(),
                middle_name: middleName.trim(),
                last_name: lastName.trim(),
                email: email.trim().toLowerCase(),
                password: password.trim(),
                company_name: companyName.trim(),
                linkedin_url: linkedInPrefix + linkedInUsername.trim(),
                role_id: typeof jobRole === 'object' ? parseInt(jobRole.id) : parseInt(jobRole),
                attendees_role: typeof jobRole === 'object' ? jobRole.label : jobRole,
                preference: selectedRoles,
            };
            const response = await fetch('https://letsmeet-backend-47lv.onrender.com/api/user-profile/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.status === 201) {
                setalertMessage('Please check your email to activate your account.');
                setAlertAction(() => () => navigation.replace('Login', { deviceToken }));
                setalertModalVisible(true);
            } else {
                setalertMessage(data.message || 'Registration failed, please try again.');
                setalertModalVisible(true);
            }
        } catch (error) {
            setalertMessage("Couldn't register. Please check your network connection.");
            setalertModalVisible(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchRoles = async () => {
            loadingRoles;
            try {
                const response = await axios.get('https://letsmeet-backend-47lv.onrender.com/api/user-profile/roles', {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.data.roles && Array.isArray(response.data.roles)) {
                    setRoles(response.data.roles);
                }
            } catch (error) {
            } finally {
                setLoadingRoles(false);
            }
        };

        fetchRoles();
    }, []);

    useEffect(() => {
        const fetchPrivacyPolicy = async () => {
            try {
                const response = await axios.get('https://letsmeet-backend-47lv.onrender.com/api/user-profile/privacy-policy', {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                setPrivacyPolicy(response.data.privacy_policy);

            } catch (error) {
                // Optionally handle error here
                console.error('Failed to fetch privacy policy:', error);
            }
        };

        fetchPrivacyPolicy();
    }, []);


    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#34495e" translucent={false} />
            <Provider>
                <RNModal
                    transparent
                    visible={errorModalVisible}
                    animationType="fade"
                    onRequestClose={() => setErrorModalVisible(false)}
                >
                    <View style={styles.errorOverlay}>
                        <View style={styles.errorBox}>
                            <Text style={styles.errorTitle}>Required Field Missing</Text>
                            <Text style={styles.errorText}>{errorMessage}</Text>
                            <TouchableOpacity
                                style={styles.errorButton}
                                onPress={() => setErrorModalVisible(false)}
                            >
                                <Text style={styles.errorButtonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </RNModal>
                <View style={styles.container}>
                    <Text style={styles.text}>Create Account</Text>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            contentContainerStyle={styles.scrollForm}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name*"
                                placeholderTextColor="#888"
                                value={fullName}
                                onChangeText={onFullNameChange}
                            />
                            <TextInput style={styles.input} placeholder="E-mail*" placeholderTextColor="#888" value={email} onChangeText={(text) => setEmail(text.toLowerCase())} />
                            <TextInput style={styles.input} placeholder="Password*" placeholderTextColor="#888" value={password} onChangeText={setPassword} />
                            <TextInput
                                style={styles.input}
                                placeholder={'LinkedIn*'}
                                placeholderTextColor="#888"
                                value={linkedInUsername ? linkedInPrefix + linkedInUsername : ''}
                                onChangeText={(text) => {
                                    // Case 0: If user has started typing and prefix is broken, restore it
                                    if (linkedInUsername && !text.startsWith(linkedInPrefix)) {
                                        setLinkedInUsername(linkedInUsername); // keep previous username, prefix will auto-add from value
                                        return;
                                    }

                                    // Case 1: If empty, reset username (placeholder will show)
                                    if (text.trim() === '') {
                                        setLinkedInUsername('');
                                        return;
                                    }

                                    // Case 2: Handle full LinkedIn URL pasted
                                    if (text.includes('linkedin.com/in/')) {
                                        let usernamePart = text.split('linkedin.com/in/')[1] || '';
                                        usernamePart = usernamePart.replace(/\/+$/, '').trim();
                                        setLinkedInUsername(usernamePart);
                                        return;
                                    }

                                    // Case 3: If prefix is missing but user types something, restore prefix
                                    if (!text.startsWith(linkedInPrefix)) {
                                        setLinkedInUsername(text.trim()); // store as username
                                        return;
                                    }

                                    // Case 4: Normal typing after prefix
                                    let usernamePart = text.slice(linkedInPrefix.length).trim();
                                    setLinkedInUsername(usernamePart);
                                }}
                                onSelectionChange={({ nativeEvent: { selection } }) => {
                                    // Lock cursor after prefix only when username exists
                                    if (linkedInUsername && selection.start < linkedInPrefix.length) {
                                        selection.start = linkedInPrefix.length;
                                        selection.end = linkedInPrefix.length;
                                    }
                                }}
                                autoCapitalize="none"
                                keyboardType="default"
                            />
                            <TextInput style={styles.input} placeholder="Company Name (optional)" placeholderTextColor="#888" value={companyName} onChangeText={setCompanyName} />

                            <TouchableOpacity
                                ref={roleRef}
                                onLayout={() => {
                                    roleRef.current?.measureInWindow((x, y, width, height) => {
                                        setAnchorLayout({ x, y, width, height });
                                        setInputWidth(width);
                                    });
                                }}
                                onPress={() => {
                                    roleRef.current?.measureInWindow((x, y, width, height) => {
                                        setAnchorLayout({ x, y, width, height });
                                        setInputWidth(width);
                                        setVisible(true);
                                    });
                                }}
                                style={styles.input}
                            >
                                <Text
                                    style={[
                                        styles.anchorText,
                                        {
                                            color: jobRole
                                                ? '#000'
                                                : '#888',
                                        },
                                    ]}
                                >
                                    {jobRole
                                        ? typeof jobRole === 'string'
                                            ? jobRole.toUpperCase()
                                            : jobRole.label.toUpperCase()
                                        : 'Role*'}
                                </Text>
                            </TouchableOpacity>

                            {anchorLayout && (
                                <Menu
                                    visible={visible}
                                    onDismiss={() => setVisible(false)}
                                    anchor={{ x: anchorLayout.x, y: anchorLayout.y + anchorLayout.height }}
                                    anchorPosition="top"
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        width: inputWidth,
                                        maxHeight: 220,
                                        borderWidth: 1,
                                        borderColor: '#888',
                                    }}
                                >
                                    <ScrollView>
                                        {roles.map((role) => (
                                            <View key={role} style={{ borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
                                                <Menu.Item
                                                    onPress={() => {
                                                        setJobRole(role);
                                                        setVisible(false);
                                                    }}
                                                    title={role.toUpperCase()}
                                                    titleStyle={{ color: 'black' }}
                                                />
                                            </View>
                                        ))}
                                    </ScrollView>
                                </Menu>
                            )}

                            <TouchableOpacity style={styles.input} onPress={() => setModalVisible(true)}>
                                <Text style={styles.anchorText}>Preferences* {selectedRoles.length !== 0 ? ': ' + selectedRoles.length : ''}</Text>
                            </TouchableOpacity>

                            <View style={{ padding: 16 }}>
                                {loading ? (
                                    <ActivityIndicator size="large" color="#34495e" />
                                ) : (
                                    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                                        <Text style={styles.buttonText}>Sign-up</Text>
                                    </TouchableOpacity>
                                )}

                                <View style={styles.condition}>
                                    <Text style={styles.agree}>
                                        By continuing you agree to our{' '}
                                        <Text
                                            style={styles.terms}
                                            onPress={() => {
                                                setPolicyModalVisible(true);
                                            }}
                                        >
                                            Terms, Conditions
                                        </Text>
                                    </Text>
                                    <Text
                                        style={[styles.policy, { textAlign: 'center', marginTop: 4 }]}
                                        onPress={() => {
                                            setPolicyModalVisible(true);
                                        }}
                                    >
                                        & Privacy Policy
                                    </Text>
                                </View>
                                <View style={styles.account}>
                                    <Text style={styles.already}>Already have an account? </Text>
                                    <TouchableOpacity onPress={() => navigation.goBack()}>
                                        <Text style={styles.login}>log-in</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>

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
                                            <Text style={styles.roleText}>{role.toUpperCase()}</Text>
                                            <Checkbox.Android
                                                status={selectedRoles.includes(role) ? 'checked' : 'unchecked'}
                                                onPress={() => toggleRole(role)}
                                                color="#34495e"
                                            />
                                        </View>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity style={styles.doneButton} onPress={() => setModalVisible(false)}>
                                    <Text style={{ color: 'white' }}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    <Modal
                        visible={policyModalVisible}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setPolicyModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <ScrollView>
                                    <Text style={styles.modalTitle}>Terms and Conditions</Text>

                                    {privacyPolicy ? (
                                        <Text style={styles.modalText}>
                                            {privacyPolicy}
                                        </Text>
                                    ) : (
                                        <Text style={styles.modalText}>Loading Privacy Policy...</Text>
                                    )}
                                </ScrollView>

                                <TouchableOpacity
                                    style={styles.doneButton}
                                    onPress={() => setPolicyModalVisible(false)}
                                >
                                    <Text style={styles.doneText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                </View>
                <Modal
                    animationType="fade"
                    transparent
                    visible={alertModalVisible}
                    onRequestClose={() => {
                        setalertModalVisible(false);
                        if (alertAction) {
                            alertAction();
                            setAlertAction(null);
                        }
                    }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContainer, { padding: 24 }]}>
                            <Text style={styles.modalTitle}>Alert</Text>
                            <Text style={styles.modalText}>{alertMessage}</Text>
                            <TouchableOpacity
                                style={[styles.doneButton, { marginTop: 16 }]}
                                onPress={() => {
                                    setalertModalVisible(false);
                                    if (alertAction) {
                                        alertAction();
                                        setAlertAction(null);
                                    }
                                }}
                            >
                                <Text style={styles.doneText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </Provider >
        </>
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
        marginBottom: 20,
        color: '#34495e',
        textAlign: 'center',
        paddingTop: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        alignSelf: 'center',
        width: '85%',
        height: 45,
        backgroundColor: '#f7faff',
        color: '#000',
    },

    anchorText: {
        color: '#888',
    },
    menuItemTitle: {
        color: '#888',
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
        paddingHorizontal: 10,
        paddingTop: 4,
        paddingBottom: 4,
    },
    tag: {
        backgroundColor: '#ddd',
        paddingHorizontal: 8,
        borderRadius: 12,
        marginRight: 5,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        maxWidth: 'auto',
        height: 25,
    },

    tagText: {
        marginRight: 8,
        color: '#000',
    },
    crossIcon: {
        fontSize: 12,
        color: '#888',
    },

    button: {
        backgroundColor: '#34495e',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        width: '50%',
        height: 39,
    },
    buttonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    condition: {
        alignItems: 'center',
        marginTop: 8,
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
    policy: {
        fontSize: 13,
        color: '#7680DE',
        fontWeight: '500',
    },
    account: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
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
    modalTitle: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#34495e',
    },
    modalText: {
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 10,
        color: '#444',
        whiteSpace: 'pre-line',
    },
    errorOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        alignItems: 'center',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e74c3c',
        marginBottom: 10,
    },
    errorText: {
        fontSize: 15,
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    errorButton: {
        backgroundColor: '#34495e',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    errorButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default SignUp;
