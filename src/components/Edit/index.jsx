import React, { useEffect, useState, useRef } from 'react';
import {
    StyleSheet, Text, TextInput, TouchableOpacity, View,
    ActivityIndicator, StatusBar, ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Modal as RNModal,
} from 'react-native';
import { Checkbox, Menu, Modal as PaperModal, Provider } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Edit = ({ route, navigation }) => {
    const {
        first_name,
        middle_name,
        last_name,
        email,
        linkedin_url,
        attendees_role,
        preference,
        company_name,
    } = route.params;

    const [newFirstName, setNewFirstName] = useState(first_name || '');
    const [newMiddleName, setNewMiddleName] = useState(middle_name || '');
    const [newLastName, setNewLastName] = useState(last_name || '');
    const [newEmail, setNewEmail] = useState(email || '');
    const linkedInPrefix = 'https://www.linkedin.com/in/';
    const [linkedInUsername, setLinkedInUsername] = useState(
        linkedin_url && linkedin_url.includes('linkedin.com/in/')
            ? linkedin_url.split('linkedin.com/in/')[1].replace(/\/+$/, '').trim()
            : ''
    );
    const [newCompanyName, setNewCompanyName] = useState(company_name || '');
    const [newJobRole, setNewJobRole] = useState(attendees_role || '');
    const [selectedRoles, setSelectedRoles] = useState(Array.isArray(preference) ? preference : []);
    const [roles, setRoles] = useState([]);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [visible, setVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [anchorLayout, setAnchorLayout] = useState(null);
    const [inputWidth, setInputWidth] = useState(0);

    const roleRef = useRef();

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await axios.get(
                    'https://letsmeet-backend-47lv.onrender.com/api/user-profile/roles',
                    { headers: { 'Content-Type': 'application/json' } }
                );
                if (response.data.roles && Array.isArray(response.data.roles)) {
                    setRoles(response.data.roles);
                }
            } catch (error) {
                console.log('Error fetching roles:', error);
            }
        };
        fetchRoles();
    }, []);

    const toggleRole = (role) => {
        setSelectedRoles((prevSelectedRoles) =>
            prevSelectedRoles.includes(role)
                ? prevSelectedRoles.filter((r) => r !== role)
                : [...prevSelectedRoles, role]
        );
    };

    const showError = (message) => {
        setErrorMessage(message);
        setErrorModalVisible(true);
    };

    const validateFields = () => {
        if (!newFirstName.trim()) {
            showError('First Name is required');
            return false;
        }
        if (!newLastName.trim()) {
            showError('Last Name is required');
            return false;
        }
        if (!newEmail.trim()) {
            showError('Email is required');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail.trim())) {
            showError('Please enter a valid email address');
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

        if (!newJobRole.trim()) {
            showError('Role is required');
            return false;
        }
        if (!selectedRoles || selectedRoles.length === 0) {
            showError('Please select at least one preference');
            return false;
        }
        return true;
    };

    const capitalizeName = (name) => {
        if (!name) {return '';}
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };


    const handleEdit = async () => {
        if (isSaving || modalVisible) {return;}

        if (!validateFields()) {
            return;
        }

        setIsSaving(true);
        try {
            const token = await AsyncStorage.getItem('token');

            const formattedFirstName = capitalizeName(newFirstName.trim());
            const formattedMiddleName = capitalizeName(newMiddleName.trim());
            const formattedLastName = capitalizeName(newLastName.trim());

            const response = await axios.put(
                'https://letsmeet-backend-47lv.onrender.com/api/user-profile/edit',
                {
                    first_name: formattedFirstName,
                    middle_name: formattedMiddleName,
                    last_name: formattedLastName,
                    email: newEmail.trim(),
                    linkedin_url: linkedInPrefix + linkedInUsername,
                    company_name: newCompanyName.trim(),
                    jobRole: newJobRole.trim(),
                    preference: selectedRoles,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                Alert.alert('Success', 'Profile updated successfully');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <Provider>
            <StatusBar barStyle="dark-content" backgroundColor="#34495e" />
            <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
                {/* RN Modal for Error */}
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
                    <View style={styles.headingContainer}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back-outline" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Edit Profile</Text>
                        <View style={styles.backButton} />
                    </View>

                    <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#888" value={newFirstName} onChangeText={setNewFirstName} />
                    <TextInput style={styles.input} placeholder="Middle Name (Optional)" placeholderTextColor="#888" value={newMiddleName} onChangeText={setNewMiddleName} />
                    <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#888" value={newLastName} onChangeText={setNewLastName} />
                    <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#888" value={newEmail} onChangeText={setNewEmail} />
                    <TextInput
                        style={styles.input}
                        placeholder={linkedInPrefix + 'your-username'}
                        value={linkedInUsername ? linkedInPrefix + linkedInUsername : linkedInPrefix}
                        onChangeText={(text) => {
                            if (!text.startsWith(linkedInPrefix)) {
                                setLinkedInUsername('');
                                return;
                            }

                            if (text.trim() === linkedInPrefix.trim()) {
                                setLinkedInUsername('');
                                return;
                            }

                            if (text.includes('linkedin.com/in/')) {
                                let usernamePart = text.split('linkedin.com/in/')[1] || '';
                                usernamePart = usernamePart.replace(/\/+$/, '').trim();
                                setLinkedInUsername(usernamePart);
                                return;
                            }

                            let usernamePart = text.slice(linkedInPrefix.length).trim();
                            setLinkedInUsername(usernamePart);
                        }}
                        onSelectionChange={({ nativeEvent: { selection } }) => {
                            if (selection.start < linkedInPrefix.length) {
                                selection.start = linkedInPrefix.length;
                                selection.end = linkedInPrefix.length;
                            }
                        }}
                        autoCapitalize="none"
                        keyboardType="default"
                    />
                    <TextInput style={styles.input} placeholder="Company Name (Optional)" placeholderTextColor="#888" value={newCompanyName} onChangeText={setNewCompanyName} />

                    {/* Role selection */}
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
                        <Text style={styles.anchorText}>{newJobRole || 'Role'}</Text>
                    </TouchableOpacity>

                    {anchorLayout && (
                        <Menu
                            visible={visible}
                            onDismiss={() => setVisible(false)}
                            anchor={{ x: anchorLayout.x, y: anchorLayout.y + anchorLayout.height }}
                            anchorPosition="top"
                            contentStyle={[
                                styles.menuContent,
                                { width: inputWidth },
                            ]}
                        >
                            <ScrollView>
                                {roles.map((role) => (
                                    <View key={role} style={styles.menuItemContainer}>
                                        <Menu.Item
                                            onPress={() => {
                                                setNewJobRole(role);
                                                setVisible(false);
                                            }}
                                            title={role}
                                            titleStyle={styles.menuItemTitle}
                                        />
                                    </View>
                                ))}
                            </ScrollView>
                        </Menu>
                    )}
                    <TouchableOpacity style={styles.input} onPress={() => setModalVisible(true)}>
                        <Text style={styles.anchorText}>
                            Preferences {selectedRoles.length !== 0 ? ': ' + selectedRoles.length : ''}
                        </Text>

                    </TouchableOpacity>

                    <PaperModal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <ScrollView style={styles.scrollViewMaxHeight}>
                                    {roles.map((role, index) => (
                                        <TouchableOpacity key={index} style={styles.checkboxRow} onPress={() => toggleRole(role)}>
                                            <Text style={styles.roleText}>{role}</Text>
                                            <Checkbox.Android
                                                status={selectedRoles.includes(role) ? 'checked' : 'unchecked'}
                                                color="#34495e"
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity style={styles.doneButton} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.doneText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </PaperModal>

                    {!modalVisible && (
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.button} onPress={handleEdit} disabled={isSaving}>
                                {isSaving ? (
                                    <View style={styles.menuItemRow}>
                                        <ActivityIndicator size="small" color="#fff" style={styles.activityIndicatorMargin} />
                                        <Text style={styles.buttonText}>Saving...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.buttonText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Provider>
    );
};

export default Edit;


const styles = StyleSheet.create({
    flex1: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#e8effc',
    },
    menuItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonContainer: {
        marginBottom: 50,
        marginTop: 10,
    },
    scrollViewMaxHeight: {
        maxHeight: 250,
    },
    menuContent: {
        backgroundColor: 'white',
        maxHeight: 220,
        borderWidth: 1,
        borderColor: '#888',
    },
    menuItemTitle: {
        color: 'black',
    },
    menuItemContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        textAlign: 'center',
    },
    headingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#34495e',
        height: 70,
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    backButton: {
        width: 24,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        alignSelf: 'center',
        width: '85%',
        height: 45,
        backgroundColor: '#f7faff',
        color: '#000',
    },
    anchorText: {
        color: '#555',
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
        fontWeight: 'bold',
    },
    selectedWrapper: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    tag: {
        backgroundColor: '#ddd',
        paddingHorizontal: 8,
        borderRadius: 12,
        marginRight: 5,
        marginBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
        height: 25,
    },
    tagText: {
        marginRight: 8,
        color: '#000',
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
    activityIndicatorMargin: {
        marginRight: 8,
    },

});
