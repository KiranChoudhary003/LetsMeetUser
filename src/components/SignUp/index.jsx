import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image, KeyboardAvoidingView, Alert, Dimensions, StatusBar } from 'react-native';
import { ActivityIndicator, Checkbox, IconButton, Menu, Modal, Provider } from 'react-native-paper';
import { ScrollView } from 'react-native-gesture-handler';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const SignUp = ({ navigation, route }) => {
    const { deviceToken } = route.params || {};

    const [jobRole, setJobRole] = useState('');
    const [visible, setVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [password, setPassword] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [loading, setLoading] = useState(false);
    const [policyModalVisible, setPolicyModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [anchorLayout, setAnchorLayout] = useState(null);
    const [inputWidth, setInputWidth] = useState(0);

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

    const handleSubmit = async () => {
        setLoading(true);

        if (!firstName || !lastName || !email || !password || !linkedin || !jobRole || selectedRoles.length === 0) {
            Alert.alert('All fields must be filled, including at least one preference.');
            setLoading(false);
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
            const response = await fetch('https://letsmeet-backend-47lv.onrender.com/api/user-profile/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.status === 201) {
                Alert.alert('Successfully Sign Up', 'Redirected into Login Page');
                navigation.replace('Login', { deviceToken });
            } else {
                Alert.alert(data.message || 'Registration failed, please try again.');
            }
        } catch (error) {
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

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#34495e" translucent={false} />
            <Provider>
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
                            <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#888" value={firstName} onChangeText={setFirstName} />
                            <TextInput style={styles.input} placeholder="Middle Name(Optional)" placeholderTextColor="#888" value={middleName} onChangeText={setMiddleName} />
                            <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#888" value={lastName} onChangeText={setLastName} />
                            <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#888" value={email} onChangeText={(text) => setEmail(text.toLowerCase())} />
                            <TextInput style={styles.input} placeholder="Create Password" placeholderTextColor="#888" value={password} onChangeText={setPassword} />
                            <TextInput style={styles.input} placeholder="LinkedIn URL" placeholderTextColor="#888" value={linkedin} onChangeText={setLinkedin} />
                            <TextInput style={styles.input} placeholder="Company Name" placeholderTextColor="#888" value={companyName} onChangeText={setCompanyName} />

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
                                            ? jobRole
                                            : jobRole.label
                                        : 'Role'}
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
                                                    title={role}
                                                    titleStyle={{ color: 'black' }}
                                                />
                                            </View>
                                        ))}
                                    </ScrollView>
                                </Menu>
                            )}

                            <TouchableOpacity style={styles.input} onPress={() => setModalVisible(true)}>
                                <Text style={styles.anchorText}>Preferences</Text>
                            </TouchableOpacity>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedWrapper}>
                                {selectedRoles.map((role, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>{role}</Text>
                                        <TouchableOpacity onPress={() => removeRole(role)}>
                                            <MaterialIcons name="close" size={16} color="#888" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        </ScrollView>
                    </KeyboardAvoidingView>

                    <View style={{ padding: 16 }}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#7680DE" />
                        ) : (
                            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                                <Text style={styles.buttonText}>Sign-up</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.condition}>
                            <Text style={styles.agree}>By continuing you agree to all </Text>
                            <Text style={styles.terms} onPress={() => {
                                setModalContent('Terms and Conditions content goes here...');
                                setPolicyModalVisible(true);
                            }}>
                                terms, condition
                            </Text>
                        </View>
                        <View style={styles.privacy}>
                            <Text style={styles.and}>& </Text>
                            <Text style={styles.policy} onPress={() => {
                                setModalContent('Privacy Policy content goes here...');
                                setPolicyModalVisible(true);
                            }}>
                                privacy policy
                            </Text>
                        </View>
                        <View style={styles.account}>
                            <Text style={styles.already}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={styles.login}>log-in</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

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

                                    <Text style={styles.modalText}>
                                        Welcome to LetsMeet!
                                    </Text>

                                    <Text style={styles.modalText}>
                                        Please read these Terms and Conditions carefully before using our app.
                                        By accessing or using the LetsMeet application (“App”), you agree to be bound by these Terms.
                                    </Text>

                                    <Text style={styles.modalText}>
                                        1. Acceptance of Terms{'\n'}
                                        By registering or using the App, you agree to abide by these Terms and our Privacy Policy.
                                    </Text>

                                    <Text style={styles.modalText}>
                                        2. User Accounts{'\n'}
                                        Users must provide accurate and complete information. You are responsible for maintaining
                                        the confidentiality of your credentials.
                                    </Text>

                                    <Text style={styles.modalText}>
                                        3. QR Code Usage{'\n'}
                                        Do not tamper with or misuse QR codes. Each code is linked to user identity.
                                    </Text>

                                    <Text style={styles.modalText}>
                                        4. Event Participation{'\n'}
                                        Users may check in to events using the app. Location access might be required.
                                    </Text>

                                    <Text style={styles.modalText}>
                                        5. User Conduct{'\n'}
                                        Do not use the app for illegal or malicious activities. Misuse may result in account termination.
                                    </Text>

                                    <Text style={styles.modalText}>
                                        6. Data & Privacy{'\n'}
                                        We collect data to improve your experience. See our Privacy Policy for full details.
                                    </Text>

                                    <Text style={styles.modalText}>
                                        7. Intellectual Property{'\n'}
                                        All app content is the property of LetsMeet and must not be reused without permission.
                                    </Text>

                                    <Text style={styles.modalText}>
                                        8. Modifications to the App{'\n'}
                                        We may update or discontinue the app at any time without notice.
                                    </Text>

                                    <Text style={styles.modalText}>
                                        9. Limitation of Liability{'\n'}
                                        LetsMeet is not responsible for damages or losses from use of the app.
                                    </Text>

                                    <Text style={styles.modalText}>
                                        10. Termination{'\n'}
                                        Accounts may be suspended for violation of terms.
                                    </Text>

                                    <Text style={styles.modalText}>
                                        11. Governing Law{'\n'}
                                        These Terms are governed by the laws of Rajasthan/India.
                                    </Text>

                                    <Text style={styles.modalText}>
                                        12. Contact Us{'\n'}
                                        For any queries, contact us at kiranchoudhary@gmail.com.
                                    </Text>
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
            </Provider>
        </>
    );
}

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
        marginBottom: 10,
        alignSelf: 'center',
        width: '85%',
        backgroundColor: '#f7faff',
        color: "#000",
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
        color: "#000"
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
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
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
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#34495e',
    },
    modalText: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
    modalText: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 10,
        color: '#444',
    },
});

export default SignUp;