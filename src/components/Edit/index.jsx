import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Checkbox, IconButton, Menu, Modal, Provider } from 'react-native-paper';
import { ScrollView } from 'react-native-gesture-handler';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await axios.get('https://letsmeet-backend-47lv.onrender.com/api/user-profile/roles', {
                    headers: { 'Content-Type': 'application/json' },
                });

                console.log('Roles response:', response.data);

                if (response.data.roles && Array.isArray(response.data.roles)) {
                    setRoles(response.data.roles);
                } else {
                    console.warn('Roles response not in expected format.');
                }
            } catch (error) {
                console.error('Failed to fetch roles:', error);
            }
        };

        fetchRoles();
    }, []);

    const handleEdit = async () => {
        if (isSaving) { return; }
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
                alert('Profile updated successfully');
                navigation.goBack();
            }
        } catch (error) {
            console.log('Error updating profile:', error.response?.data || error.message);
            alert('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        console.log('Initial selected preferences:', preference);
    }, []);

    return (
        <Provider>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backArrow}><MaterialIcons name="arrow-back" size={24} color="#000" /></Text>
                </TouchableOpacity>
                <Text style={styles.text}>Edit Account</Text>
                <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#888" value={newFirstName} onChangeText={setNewFirstName} />
                <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#888" value={newLastName} onChangeText={setNewLastName} />
                <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#888" value={newEmail} onChangeText={setNewEmail} />
                <TextInput style={styles.input} placeholder="LinkedIn URL" placeholderTextColor="#888" value={newLinkedin} onChangeText={setNewLinkedin} />

                <Menu
                    visible={visible}
                    onDismiss={() => setVisible(false)}
                    anchor={
                        <TouchableOpacity onPress={() => setVisible(true)} style={styles.input}>
                            <Text style={styles.anchorText}>{newJobRole || 'Select Role'}</Text>
                        </TouchableOpacity>
                    }
                >
                    {roles.map((role) => (
                        <Menu.Item
                            key={role}
                            onPress={() => {
                                setNewJobRole(role);
                                setVisible(false);
                            }}
                            title={role}
                            titleStyle={styles.menuItemTitle}
                        />
                    ))}
                </Menu>

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
                                        <Checkbox.Android status={selectedRoles.includes(role) ? 'checked' : 'unchecked'} color="#34495e" />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity style={styles.doneButton} onPress={() => setModalVisible(false)}>
                                <Text style={{ color: 'white' }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <View style={{ marginBottom: 10 }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.selectedWrapper}
                    >
                        {selectedRoles.map((role, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>{role}</Text>
                                <TouchableOpacity onPress={() => removeRole(role)}>
                                    <MaterialIcons name="close" size={16} color="#888" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Button with 50px gap */}
                    <TouchableOpacity
                        style={[styles.button, { marginTop: 50 }]}
                        onPress={handleEdit}
                        disabled={isSaving}
                    >
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

            </View>
        </Provider>
    );
};

export default Edit;

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
        marginBottom: 30,
        marginLeft: 40,
        width: 313,
        height: 43,
        backgroundColor: '#f7faff',
    },
    anchorText: {
        color: '#555',
    },
    menuItemTitle: {
        color: '#333',
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
        marginBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        maxWidth: 'auto',
        height: 25,
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
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        alignItems: 'center',
        marginTop: 50,
        marginLeft: 105,
        width: 194,
        height: 39,
    },
    buttonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    backArrow: {
        marginTop: 20,
        marginLeft: 10,
    },
});