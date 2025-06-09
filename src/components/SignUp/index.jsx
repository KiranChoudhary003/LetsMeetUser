import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { Checkbox, IconButton, Menu, Modal, Provider } from 'react-native-paper';
import ellipse from '../../assets/Ellipse.png'
import ellipseTwo from '../../assets/EllipseTwo.png'
import ellipseBottom from '../../assets/EllipseBottom.png'
import ellipseBottomTwo from '../../assets/EllipseBottomTwo.png'
import { ScrollView } from 'react-native-gesture-handler';
import axios from 'axios';

const SignUp = ({ navigation }) => {
    const [jobRole, setJobRole] = useState('')
    const [visible, setVisible] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedRoles, setSelectedRoles] = useState([])
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [linkedin, setLinkedin] = useState('')
    const [password, setPassword] = useState('')
    const [roles, setRoles] = useState([])
    const [loadingRoles, setLoadingRoles] = useState(true)

    const toggleRole = (role) => {
        setSelectedRoles((prevSelectedRoles) => {
            if (prevSelectedRoles.includes(role)) {
                return prevSelectedRoles.filter((r) => r !== role);
            } else {
                return [...prevSelectedRoles, role];
            }
        });
    }

    const handleSubmit = async () => {
        if (!firstName || !lastName || !email || !password || !linkedin || !jobRole || selectedRoles.length === 0) {
            alert('All fields must be filled, including at least one preference.');
            return;
        }

        try {
            // Prepare the payload according to the API documentation.
            const payload = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                password: password,
                linkedin_url: linkedin,
                // Assuming jobRole is either an object (with an id and label) or just a string.
                role_id: typeof jobRole === 'object' ? parseInt(jobRole.id) : parseInt(jobRole),
                attendees_role: typeof jobRole === 'object' ? jobRole.label : jobRole,
                preference: selectedRoles, // Array of preferences
            };
            console.log(`Api is fetchinng`)
            // Perform the API call using fetch.
            const response = await fetch('https://letsmeet-backend-47lv.onrender.com/api/user-profile/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
            });
            console.log(`API successfully fetch`)

            const data = await response.json();

            if (response.status === 201) {
                // Successful registration. Optionally, store data.userId if needed.
                navigation.navigate('Profile', {
                    firstName,
                    lastName,
                    email,
                    password,
                    linkedin,
                    jobRole,
                    preferences: selectedRoles,
                    userId: data.userId, // Passing the returned userId from the API.
                });
            } else {
                alert(data.message || 'Registration failed, please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert("Error: Couldn't register. Please check your network connection.");
        }
    };


    const removeRole = (role) => {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
    };

    // const roles = [
    //     'Developer',
    //     'Data Scientist',
    //     'Database Administrator',
    //     'Computer Systems Analyst',
    //     'Web Developer',
    //     'DevOps Engineer',
    //     'Network Engineer',
    //     'IT Project Manager'
    // ]

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                console.log(`Api is fetching`)
                const response = await axios.get('https://letsmeet-backend-47lv.onrender.com/api/user-profile/roles', {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                console.log(`api is successfully fetched`)
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
                <Image source={ellipse} style={styles.ellipseTopOne} />
                <Image source={ellipseTwo} style={styles.ellipseTopTwo} />
                <Text style={styles.text}>Create Account</Text>
                <TextInput style={styles.input} placeholder='First Name' value={firstName} onChangeText={setFirstName} />
                <TextInput style={styles.input} placeholder='Last Name' value={lastName} onChangeText={setLastName} />
                <TextInput style={styles.input} placeholder='E-mail' value={email} onChangeText={setEmail} />
                <TextInput style={styles.input} placeholder='Create Password' value={password} onChangeText={setPassword} />
                <TextInput style={styles.input} placeholder='LinkedIn URL' value={linkedin} onChangeText={setLinkedin} />
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
                            titleStyle={styles.menuItemTitle} // customize title style if needed
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
                            <ScrollView style={{ maxHeight: 500 }}>
                                {roles.map((role, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.checkboxRow}
                                        onPress={() => toggleRole(role)}
                                    >
                                        <Text style={styles.roleText}>{role}</Text>
                                        <Checkbox.Android
                                            status={selectedRoles.includes(role) ? 'checked' : 'unchecked'}
                                            color="#7680DE"
                                        />
                                    </TouchableOpacity>
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

                {/* Selected roles display */}
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

                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Sign-in</Text>
                </TouchableOpacity>
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
                <Image source={ellipseBottom} style={styles.ellipseBottom} />
                <Image source={ellipseBottomTwo} style={styles.ellipseBottomTwo} />
                <Image />
            </View>
        </Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        fontSize: 25,
        color: "#465BF3",
        fontWeight: "bold",
        marginBottom: 20,
    },
    input: {
        width: 313,
        height: 43,
        margin: 10,
        borderRadius: 5,
        backgroundColor: "#7680DE4D",
        paddingHorizontal: 10,
        paddingVertical: 10,
        color: "#000000",
        justifyContent: 'center',
    },
    button: {
        width: 194,
        height: 39,
        backgroundColor: '#7680DE',
        borderRadius: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    ellipseTopOne: {
        position: "absolute",
        top: -70,
        left: 0
    },
    ellipseTopTwo: {
        position: "absolute",
        top: -100,
        left: 50
    },
    ellipseBottom: {
        position: "absolute",
        bottom: -80,
        right: 0
    },
    ellipseBottomTwo: {
        position: "absolute",
        bottom: -80,
        left: 0
    },
    anchorText: {
        fontSize: 15,
        fontWeight: '16',
        color: '#666',
        textAlign: 'left',
        paddingLeft: 5,
    },

    condition: {
        display: 'flex',
        flexDirection: 'row',
        marginTop: 10
    },
    agree: {
        fontSize: 12
    },
    terms: {
        fontSize: 12,
        color: "#7680DE"
    },
    privacy: {
        display: 'flex',
        flexDirection: 'row',
        margin: 5
    },
    and: {
        fontSize: 12
    },
    policy: {
        fontSize: 12,
        color: "#7680DE"
    },
    account: {
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
        bottom: -20,
        left: 0
    },
    already: {
        fontSize: 12
    },
    login: {
        fontSize: 12,
        color: '#777'
    },
    selectedWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    tag: {
        backgroundColor: '#ddd',
        paddingHorizontal: 5,
        paddingVertical: 3,
        borderRadius: 12,
        marginRight: 5,
        marginBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        maxWidth: '50%',
        height: 20,
    },

    tagText: {
        fontSize: 10,
        color: '#000',
        flexShrink: 1,
        marginRight: -25,
    },

    crossIcon: {
        fontSize: 10,
        color: '#333',
        marginRight: -30,
    },
    modalOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
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
        backgroundColor: '#7680DE',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    doneText: {
        color: 'white',
        fontSize: 14,
    },

});

export default SignUp;