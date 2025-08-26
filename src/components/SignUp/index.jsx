/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, StatusBar, useColorScheme, Platform, Modal as RNModal } from 'react-native';
import { ActivityIndicator, Checkbox, Menu, Modal, Provider } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ScrollView } from 'react-native-gesture-handler';
import validator from 'validator';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    const [showPassword, setShowPassword] = useState(false);
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
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState(null);
    const [passwordTooltipHeight, setPasswordTooltipHeight] = useState(0);
    const [showEmailTooltip, setShowEmailTooltip] = useState(false);
    const [passwordTooltipWidth, setPasswordTooltipWidth] = useState(0);
    const [emailTooltipHeight, setEmailTooltipHeight] = useState(0);
    const [emailTooltipWidth, setEmailTooltipWidth] = useState(0);
    const emailRef = useRef(null);
    const [emailPos, setEmailPos] = useState(null);
    const containerRef = useRef(null);




    const roleRef = useRef(null);
    const passwordRef = useRef(null);

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

    const rules = [
        { regex: /.{8,}/, message: "At least 8 characters" },
        { regex: /^.{0,20}$/, message: "No more than 20 characters" },
        { regex: /^\S*$/, message: "No spaces allowed" },
        { regex: /[A-Z]/, message: "At least one uppercase letter" },
        { regex: /[a-z]/, message: "At least one lowercase letter" },
        { regex: /[0-9]/, message: "At least one number" },
        { regex: /[!@#$%^&*(),.?\":{}|<>]/, message: "At least one special character" },
    ];

    const checkRule = (rule) => rule.regex.test(password);
    const passwordValid = rules.every(checkRule);

    const emailRules = [
    { check: (email) => !/[^a-zA-Z0-9@._-]/.test(email), message: "No invalid characters" },
    { check: (email) => !email.includes(".."), message: "No consecutive dots" },
    { check: (email) => !/\s/.test(email), message: "No spaces allowed" },
    { check: (email) => validator.isEmail(email), message: "Must be a valid email" },
];


    const checkEmailRule = (rule) => rule.check(email);
    const allEmailValid = emailRules.every(checkEmailRule);




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

    const validatePassword = (passwordToValidate) => {
        const commonPasswords = [
            'Password@123', 'Admin@123', 'Welcome@123', 'Test@123', 'Qwerty@123',
            'Aa@12345', 'Pass@123', 'India@123', 'User@123', 'Hello@123', 'P@ssw0rd',
            'P@ssword1', 'Abc@1234', 'Temp@123', 'Demo@123', 'Sample@123',
            'Login@123', 'Letmein@123'
        ];

        const dictionaryWords = [
            'password', 'admin', 'welcome', 'test', 'qwerty', 'abc', 'abcd',
            'letmein', 'user', 'temp', 'demo', 'login', 'india', 'hello', 'sample',
            'football', 'iloveyou', 'monkey', 'dragon', 'sunshine', 'princess',
            'master', 'shadow', 'superman', 'batman', 'pokemon', 'naruto',
        ];

        const isCommonPattern = (password) => {
            const lower = password.toLowerCase();
            for (let word of dictionaryWords) {
                const pattern = new RegExp(`^[^a-zA-Z]*${word}[^a-zA-Z]*$`, 'i');
                if (pattern.test(password)) {
                    return true;
                }
            }
            const currentYear = new Date().getFullYear();
            const years = [];
            for (let y = 2000; y <= currentYear + 2; y++) {
                years.push(String(y));
            }
            for (let year of years) {
                if (
                    lower.startsWith(year) ||
                    lower.endsWith(year) ||
                    /^[^a-zA-Z]*\d{4}[^a-zA-Z]*$/.test(lower)
                ) {
                    return true;
                }
            }
            if (lower.includes('123') || lower.includes('abc') || lower.includes('qwerty')) {
                return true;
            }
            return false;
        };

        if (!passwordToValidate.trim()) {
            return 'Password is required';
        }

        const trimmedPassword = passwordToValidate.trim();
        if (trimmedPassword.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        if (trimmedPassword.length > 20) {
            return 'Password cannot exceed 20 characters';
        }
        if (/\s/.test(trimmedPassword)) {
            return 'Spaces are not allowed in password';
        }
        if (!/[A-Z]/.test(trimmedPassword)) {
            return 'Password must include at least one uppercase letter';
        }
        if (!/[a-z]/.test(trimmedPassword)) {
            return 'Password must include at least one lowercase letter';
        }
        if (!/[0-9]/.test(trimmedPassword)) {
            return 'Password must include at least one number';
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(trimmedPassword)) {
            return 'Password must include at least one special character';
        }
        if (/[^A-Za-z0-9!@#$%^&*(),.?":{}|<>]/.test(trimmedPassword)) {
            return 'Password contains invalid characters';
        }
        if (commonPasswords.includes(trimmedPassword)) {
            return 'Password is too common. Choose a stronger one';
        }
        if (isCommonPattern(trimmedPassword)) {
            return 'Password is too predictable. Choose a stronger one';
        }
        return true;
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

            const emailValidationResult = validateEmail(email);
            if (emailValidationResult !== true) {
                showError(emailValidationResult);
                return false;
            }


            const passwordValidation = validatePassword(password);
            if (passwordValidation !== true) {
                showError(passwordValidation);
                return;
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
        <Provider>
            <StatusBar barStyle={useColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />

            <SafeAreaView style={styles.container}>
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
                        {/* Root wrapper so tooltip can be absolute */}
                        <View style={{ flex: 1 }} ref={containerRef}>
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
                                        value={email}
                                        onChangeText={(text) => {
                                            const lower = text.toLowerCase();
                                            setEmail(lower);

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


                                {/* Password Input */}
                                <View
                                    style={styles.inputContainer}
                                    ref={passwordRef}
                                    onLayout={() => {
                                        if (containerRef.current && passwordRef.current) {
                                            passwordRef.current.measureLayout(
                                                containerRef.current,
                                                (x, y, width, height) => {
                                                    setTooltipPos({ x, y, width, height });
                                                }
                                            );
                                        }
                                    }}
                                >
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Password*"
                                        placeholderTextColor="#888"
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            // show tooltip if password is non-empty and invalid
                                            if (text.length > 0 && !rules.every((r) => r.regex.test(text))) {
                                                setShowTooltip(true);
                                            } else {
                                                setShowTooltip(false);
                                            }
                                        }}
                                        onFocus={() => {
                                            if (password.length > 0 && !rules.every((r) => r.regex.test(password))) {
                                                setShowTooltip(true);
                                            }
                                        }}
                                        onBlur={() => setShowTooltip(false)} // hide tooltip when leaving password field
                                    />

                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <MaterialIcons
                                            name={showPassword ? 'visibility-off' : 'visibility'}
                                            size={22}
                                            color="#888"
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* LinkedIn Input */}
                                <TextInput
                                    style={styles.input}
                                    placeholder={'LinkedIn*'}
                                    placeholderTextColor="#888"
                                    value={linkedInUsername ? linkedInPrefix + linkedInUsername : ''}
                                    onChangeText={(text) => {
                                        if (linkedInUsername && !text.startsWith(linkedInPrefix)) {
                                            setLinkedInUsername(linkedInUsername);
                                            return;
                                        }
                                        if (text.trim() === '') {
                                            setLinkedInUsername('');
                                            return;
                                        }
                                        if (text.includes('linkedin.com/in/')) {
                                            let usernamePart = text.split('linkedin.com/in/')[1] || '';
                                            usernamePart = usernamePart.replace(/\/+$/, '').trim();
                                            setLinkedInUsername(usernamePart);
                                            return;
                                        }
                                        if (!text.startsWith(linkedInPrefix)) {
                                            setLinkedInUsername(text.trim());
                                            return;
                                        }
                                        let usernamePart = text.slice(linkedInPrefix.length).trim();
                                        setLinkedInUsername(usernamePart);
                                    }}
                                    onSelectionChange={({ nativeEvent: { selection } }) => {
                                        if (linkedInUsername && selection.start < linkedInPrefix.length) {
                                            selection.start = linkedInPrefix.length;
                                            selection.end = linkedInPrefix.length;
                                        }
                                    }}
                                    autoCapitalize="none"
                                    keyboardType="default"
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Company Name (optional)"
                                    placeholderTextColor="#888"
                                    value={companyName}
                                    onChangeText={setCompanyName}
                                />

                                {/* Role Input */}
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
                                            { color: jobRole ? '#000' : '#888' },
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
                                                <View
                                                    key={role}
                                                    style={{ borderBottomWidth: 1, borderBottomColor: '#ccc' }}
                                                >
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

                                <TouchableOpacity
                                    style={styles.input}
                                    onPress={() => setModalVisible(true)}
                                >
                                    <Text style={styles.anchorText}>
                                        Preferences* {selectedRoles.length !== 0 ? ': ' + selectedRoles.length : ''}
                                    </Text>
                                </TouchableOpacity>

                                {/* Submit */}
                                <View style={{ padding: 16 }}>
                                    {loading ? (
                                        <ActivityIndicator size="large" color="#34495e" />
                                    ) : (
                                        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                                            <Text style={styles.buttonText}>Sign Up</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
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
                                        <Text style={styles.login}>Log In</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>

                            {showEmailTooltip && !allEmailValid && emailPos && (
                                <View
                                    style={[
                                        styles.tooltipOverlay,
                                        {
                                            top: emailPos.y - emailTooltipHeight, // use emailTooltipHeight
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
                                    <View style={styles.arrowDown} />
                                </View>
                            )}

                            {/* Tooltip Floating Layer */}
                            {showTooltip && !passwordValid && tooltipPos && (
                                <View
                                    style={[
                                        styles.tooltipOverlay,
                                        {
                                            top: tooltipPos.y - passwordTooltipHeight,
                                            left: tooltipPos.x + tooltipPos.width - passwordTooltipWidth,
                                        },
                                    ]}
                                    onLayout={(e) => {
                                        setPasswordTooltipHeight(e.nativeEvent.layout.height);
                                        setPasswordTooltipWidth(e.nativeEvent.layout.width);
                                    }}
                                >
                                    <View style={styles.tooltip}>
                                        {rules.map((rule, index) => {
                                            const passed = rule.regex.test(password);
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
                                    <View style={styles.arrowDown} />
                                </View>
                            )}
                        </View>
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
                            <View style={styles.privacymodalContainer}>
                                <Text style={styles.modalTitle}>Terms and Conditions</Text>
                                <ScrollView>
                                    {privacyPolicy ? (
                                        privacyPolicy.split('\n').map((line, index) => {
                                            const trimmed = line.trim();

                                            if (!trimmed) {
                                                return <Text key={index} />;
                                            }

                                            if (trimmed === trimmed.toUpperCase() || trimmed.endsWith(':')) {
                                                return (
                                                    <Text key={index} style={styles.privacyHeading}>
                                                        {trimmed}
                                                    </Text>
                                                );
                                            }

                                            // Bullet points
                                            const listMatch = trimmed.match(/^(\d+[\.\)]\s|[IVXLCDM]+\.\s|[a-zA-Z][\.\)]\s|[•\-*]\s?)(.*)$/);
                                            if (listMatch) {
                                                return (
                                                    <View
                                                        key={index}
                                                        style={{ flexDirection: 'row', marginBottom: 4 }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 15,
                                                                lineHeight: 22,
                                                                color: '#444',
                                                                marginRight: 6,
                                                            }}
                                                        >
                                                            {listMatch[1].trim()}
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                fontSize: 15,
                                                                lineHeight: 22,
                                                                color: '#444',
                                                                flex: 1,
                                                                textAlign: 'left',
                                                            }}
                                                        >
                                                            {listMatch[2].trim()}
                                                        </Text>
                                                    </View>
                                                );
                                            }

                                            // Normal paragraphs
                                            return (
                                                <Text key={index} style={styles.privacyParagraph}>
                                                    {trimmed}
                                                </Text>
                                            );

                                        })
                                    ) : (
                                        <Text style={{ fontSize: 16, color: '#666' }}>Loading Privacy Policy...</Text>
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
            </SafeAreaView >
        </Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8effc',
    },
    inputContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 8,
        borderRadius: 8,
        marginBottom: 12,
        alignSelf: 'center',
        width: '85%',
        height: 45,
        backgroundColor: '#f7faff',
        flexDirection: 'row',
        alignItems: 'center',
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
    passwordInput: {
        flex: 1,
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
    privacymodalContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
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
    privacyHeading: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#222',
        textAlign: 'left',
    },
    privacyParagraph: {
        fontSize: 15,
        lineHeight: 22,
        color: '#444',
        flex: 1,
        textAlign: 'left',
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



});

export default SignUp;
