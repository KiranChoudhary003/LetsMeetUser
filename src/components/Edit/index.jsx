import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@react-native-community/blur';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Modal as RNModal,
    ScrollView,
    StatusBar,
    StyleSheet, Text, TextInput, TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { Checkbox, Menu, Modal as PaperModal, Provider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import validator from 'validator';

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
    const [fullName, setFullName] = React.useState('');
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
    const [showEmailTooltip, setShowEmailTooltip] = useState(false);
    const [emailTooltipHeight, setEmailTooltipHeight] = useState(0);
    const [emailTooltipWidth, setEmailTooltipWidth] = useState(0);
    const emailRef = useRef(null);
    const [emailPos, setEmailPos] = useState(null);
    const containerRef = useRef(null);
    const [AlertVisible, setAlertVisible] = useState(false);
    const [AlertMessage, setAlertMessage] = useState('');


    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await axios.get(
                    `${BASE_URL}/api/user-profile/roles`,
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

    const triggerEventAlert = (message) => {
        setAlertMessage(message);
        setAlertVisible(true);
    };

    const showError = (message) => {
        setErrorMessage(message);
        setErrorModalVisible(true);
    };

    useEffect(() => {
        const combined = [first_name, middle_name, last_name].filter(Boolean).join(' ');
        setFullName(combined);
    }, [first_name, middle_name, last_name]);

    const onFullNameChange = (text) => {
        setFullName(text);

        const parts = text.trim().split(/\s+/);

        if (parts.length === 1) {
            // Only first name
            setNewFirstName(parts[0]);
            setNewMiddleName('');
            setNewLastName('');
        } else if (parts.length === 2) {
            // First + Last
            setNewFirstName(parts[0]);
            setNewMiddleName('');
            setNewLastName(parts[1]);
        } else {
            // First + Middle + Last (or longer)
            setNewFirstName(parts[0]);
            setNewMiddleName(parts[1]);
            setNewLastName(parts.slice(2).join(' '));
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


    const validateFields = () => {
        if (!fullName.trim()) {
            showError('Full Name is required');
            return false;
        }

        const emailValidationResult = validateEmail(email);
        if (emailValidationResult !== true) {
            showError(emailValidationResult);
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
        if (!name) { return ''; }
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };


    const emailRules = [
        { check: (email) => !/[^a-zA-Z0-9@._-]/.test(email), message: "No invalid characters" },
        { check: (email) => !email.includes(".."), message: "No consecutive dots" },
        { check: (email) => !/\s/.test(email), message: "No spaces allowed" }, // <-- new rule
        { check: (email) => validator.isEmail(email), message: "Must be a valid email" },
    ];


    const checkEmailRule = (rule) => rule.check(newEmail.trim());
    const allEmailValid = emailRules.every((rule) => rule.check(newEmail.trim()));


    const handleEdit = async () => {
        if (isSaving || modalVisible) { return; }

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
                `${BASE_URL}/api/user-profile/edit`,
                {
                    first_name: formattedFirstName,
                    middle_name: formattedMiddleName || null,
                    last_name: formattedLastName || null,
                    email: newEmail.trim(),
                    linkedin_url: linkedInPrefix + linkedInUsername,
                    company_name: newCompanyName.trim(),
                    attendees_role: newJobRole.trim(),
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
                triggerEventAlert(
                    'Your profile has been successfully updated.'
                );
            }
        } catch (error) {
            triggerEventAlert('Unable to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#34495e' }} >
            <Provider>
                <StatusBar
                    translucent
                    backgroundColor="transparent"
                    barStyle="light-content"
                />
                <View style={styles.container}>
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

                        <View ref={containerRef}>
                            <View style={styles.headingContainer}>
                                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                    <Ionicons name="arrow-back-outline" size={24} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.title}>Edit Profile</Text>
                                <View style={styles.backButton} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name*"
                                placeholderTextColor="#888"
                                value={fullName}
                                onChangeText={onFullNameChange}
                            />
                            <View
                                style={{ width: "85%", alignSelf: "center", height: 45, marginBottom: 12 }}
                                ref={emailRef}
                                onLayout={() => {
                                    if (containerRef.current && emailRef.current) {
                                        emailRef.current.measureLayout(
                                            containerRef.current,
                                            (x, y, width, height) => {
                                                setEmailPos({ x, y, width, height });
                                            }
                                        );
                                    }
                                }}
                            >
                                <TextInput
                                    style={[styles.input, { width: "100%", marginBottom: 0 }]}
                                    placeholder="E-mail*"
                                    placeholderTextColor="#888"
                                    value={newEmail}
                                    onChangeText={(text) => {
                                        const lower = text.toLowerCase();
                                        setNewEmail(lower);

                                        const isValid = emailRules.every((rule) => rule.check(lower));
                                        setShowEmailTooltip(text.length > 0 && !isValid);
                                    }}
                                    onFocus={() => {
                                        const isValid = emailRules.every((rule) => rule.check(email));
                                        if (email.length > 0 && !isValid) setShowEmailTooltip(true);
                                    }}
                                    onBlur={() => setShowEmailTooltip(false)}
                                />
                            </View>
                            {/* <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#888" value={newEmail} onChangeText={setNewEmail} /> */}
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
                        {showEmailTooltip && !allEmailValid && emailPos && (
                            <View
                                style={[
                                    styles.tooltipOverlay,
                                    {
                                        top: emailPos.y - emailTooltipHeight,
                                        left: emailPos.x + emailPos.width - emailTooltipWidth,
                                    },
                                ]}
                                onLayout={(e) => {
                                    setEmailTooltipHeight(e.nativeEvent.layout.height);
                                    setEmailTooltipWidth(e.nativeEvent.layout.width);
                                }}
                            >
                                <View style={styles.tooltip}>
                                    {emailRules.map((rule, index) => {
                                        const passed = checkEmailRule(rule);
                                        return (
                                            <View
                                                key={index}
                                                style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}
                                            >
                                                <MaterialIcons
                                                    name={passed ? "check-circle" : "cancel"}
                                                    size={16}
                                                    color={passed ? "lightgreen" : "red"}
                                                    style={{ marginRight: 6 }}
                                                />
                                                <Text style={styles.tooltipText}>{rule.message}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                                {/* arrow pointing downward into input */}
                                <View style={styles.arrowDown} />
                            </View>
                        )}
                    </KeyboardAvoidingView>
                    <PaperModal
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
                    </PaperModal>
                    <Modal
                        transparent
                        visible={AlertVisible}
                        animationType="fade"
                        onRequestClose={() => setAlertVisible(false)}
                    >
                        <TouchableOpacity
                            style={styles.overlayBox}
                            activeOpacity={1}
                            onPressOut={() => setAlertVisible(false)}
                        >
                            {/* Blur background */}
                            <BlurView
                                style={StyleSheet.absoluteFill}
                                blurType="light"                           // keep it light for premium subtlety
                                blurAmount={3}                            // stronger blur for soft glass effect
                                reducedTransparencyFallbackColor="rgba(255,255,255,0.1)"  // very subtle fallback
                            />

                            <View style={styles.containerBox}>
                                <Text style={styles.titleBox}>Message</Text>
                                <Text style={styles.messageBox}>{AlertMessage}</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setAlertVisible(false);
                                        navigation.goBack();
                                    }}
                                    style={styles.buttonBox}
                                >
                                    <Text style={styles.buttonTextBox}>OK</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </View>
            </Provider>
        </SafeAreaView>
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
        marginBottom: 12,
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
    tooltipOverlay: {
        position: "absolute",
        alignItems: "center",
        backgroundColor: "transparent",
        zIndex: 9999,   // 👈 force top stacking
        elevation: 9999, // 👈 required for Android
    },

    tooltip: {
        backgroundColor: "#333",
        padding: 12,
        borderRadius: 8,
        maxWidth: 280,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 10,
    },
    tooltipText: {
        fontSize: 12,
        color: "#fff",
    },
    arrowDown: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: "#333",
        marginTop: -1,
    },
    inputMeasureWrapper: {
        width: '85%',        // same width as your input
        alignSelf: 'center', // center horizontally
        height: 45,          // same height as your input
        marginBottom: 12,    // same spacing
        position: 'absolute', // invisible layer for measuring
        opacity: 0,           // doesn’t change UI
    },
    overlayBox: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    containerBox: {
        backgroundColor: '#fff',
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderRadius: 16,
        minWidth: '60%',
        maxWidth: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    titleBox: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center',
        color: '#222',
    },
    messageBox: {
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
        color: '#555',
        lineHeight: 20,
    },
    buttonBox: {
        backgroundColor: '#34495E',
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
    },
    buttonTextBox: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        textAlign: 'center',
        letterSpacing: 0.4,
    },

});
