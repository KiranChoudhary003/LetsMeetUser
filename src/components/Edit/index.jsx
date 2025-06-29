import React, { useEffect, useState, useRef } from 'react';
import {
    StyleSheet, Text, TextInput, TouchableOpacity, View,
    ActivityIndicator, StatusBar, ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { Checkbox, Menu, Modal, Provider } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Edit = ({ route, navigation }) => {
    const { first_name, last_name, email, linkedin_url, attendees_role, preference } = route.params;

    const [newFirstName, setNewFirstName] = useState(first_name);
    const [newLastName, setNewLastName] = useState(last_name);
    const [newEmail, setNewEmail] = useState(email);
    const [newLinkedin, setNewLinkedin] = useState(linkedin_url);
    const [newJobRole, setNewJobRole] = useState(attendees_role);
    const [selectedRoles, setSelectedRoles] = useState(Array.isArray(preference) ? preference : []);
    const [roles, setRoles] = useState([]);

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

    const removeRole = (role) => {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
    };

    const handleEdit = async () => {
        if (isSaving || modalVisible) return;
        setIsSaving(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.put(
                'https://letsmeet-backend-47lv.onrender.com/api/user-profile/edit',
                {
                    first_name: newFirstName,
                    last_name: newLastName,
                    email: newEmail,
                    linkedin_url: newLinkedin,
                    jobRole: newJobRole,
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
                Alert.alert('Profile updated successfully');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Provider>
            <StatusBar barStyle="dark-content" backgroundColor="#34495e" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
                <View style={styles.container}>
                    <View style={styles.headingContainer}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back-outline" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Edit Profile</Text>
                        <View style={styles.backButton} />
                    </View>

                    <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#888" value={newFirstName} onChangeText={setNewFirstName} />
                    <TextInput style={styles.input} placeholder="Middle Name(Optional)" placeholderTextColor="#888" />
                    <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#888" value={newLastName} onChangeText={setNewLastName} />
                    <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#888" value={newEmail} onChangeText={setNewEmail} />
                    <TextInput style={styles.input} placeholder="LinkedIn URL" placeholderTextColor="#888" value={newLinkedin} onChangeText={setNewLinkedin} />
                    <TextInput style={styles.input} placeholder="Company Name" placeholderTextColor="#888" />

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
                                    <View
                                        key={role}
                                        style={{
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#ccc',
                                            textAlign: "center"
                                        }}
                                    >
                                        <Menu.Item
                                            onPress={() => {
                                                setNewJobRole(role);
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

                    <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <ScrollView style={{ maxHeight: 250 }}>
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
                    </Modal>

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

                    {!modalVisible && (
                        <View style={{ marginBottom: 50, marginTop: 10 }}>
                            <TouchableOpacity style={styles.button} onPress={handleEdit} disabled={isSaving}>
                                {isSaving ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
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
    container: {
        flex: 1,
        backgroundColor: '#e8effc',
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
        height : 45,
        backgroundColor: '#f7faff',
        color: "#000",
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
        color: "#000",
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
});
