import React, { use, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { Checkbox, IconButton, Menu, Modal, Provider } from 'react-native-paper';
import ellipse from '../../assets/Ellipse.png'
import ellipseTwo from '../../assets/EllipseTwo.png'
import ellipseBottom from '../../assets/EllipseBottom.png'
import ellipseBottomTwo from '../../assets/EllipseBottomTwo.png'
import { ScrollView } from 'react-native-gesture-handler';

const Edit = ({route, navigation}) => {

    const { firstName, lastName, email, password, linkedin, jobRole, preferences } = route.params;

    const [newJobRole, setNewJobRole] = useState('')
    const [visible, setVisible] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedRoles, setSelectedRoles] = useState([])
    const [newFirstName, setNewFirstName] = useState('')
    const [newLastName, setNewLastName] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [newLinkedin, setNewLinkedin] = useState('')
    const [newPassword, setNewPassword] = useState('')

    const toggleRole = (role) => {
        setSelectedRoles((prevSelectedRoles) => {
            if (prevSelectedRoles.includes(role)) {
                return prevSelectedRoles.filter((r) => r !== role);
            } else {
                return [...prevSelectedRoles, role];
            }
        });
    }

    const handleSubmit = () => {
        navigation.navigate('Scanner')
    }

    const roles = [
        'Developer',
        'Data Scientist',
        'Database Administrator',
        'Computer Systems Analyst',
        'Web Developer',
        'DevOps Engineer',
        'Network Engineer',
        'IT Project Manager'
    ]

    const removeRole = (role) => {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
    }

    return (
        <Provider>
            <View style={styles.container}>
                <Image source={ellipse} style={styles.ellipseTopOne} />
                <Image source={ellipseTwo} style={styles.ellipseTopTwo} />
                <Text style={styles.text}>Create Account</Text>
                <TextInput style={styles.input} placeholder='First Name' value={firstName} onChangeText={setNewFirstName} />
                <TextInput style={styles.input} placeholder='Last Name' value={lastName} onChangeText={setNewLastName} />
                <TextInput style={styles.input} placeholder='E-mail' value={email} onChangeText={setNewEmail} />
                <TextInput style={styles.input} placeholder='Create Password' value={password} onChangeText={setNewPassword} />
                <TextInput style={styles.input} placeholder='LinkedIn URL' value={linkedin} onChangeText={setNewLinkedin} />
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
                                setNewJobRole(role);
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
                                            color="#7680DE" // Optional: customize tick color
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
                    <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
            </View>
        </Provider>
    )
}

export default Edit

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

})