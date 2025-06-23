import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ComplainCard = ({ description, status, updatedAt }) => {

    let statusColor = '#ddd';
    let backgroundColor = '#fff';

    if (status === 'pending') {
        backgroundColor = 'rgba(157, 9, 11, 0.96 )';
    } else if (status === 'in_progress') {
        statusColor = '#333';
        backgroundColor = 'rgba(221, 177, 31)';
    } else if (status === 'complete') {
        backgroundColor = ' #28a745';
    }

    return (
        <View style={styles.card}>
            <View style={styles.complainData}>
                <View style={styles.complainDetails}>
                    <Text style={styles.description}>{description}</Text>
                </View>
                <View style={styles.date}>
                    <Text style={{ paddingVertical: 3 }}>
                        {new Date(updatedAt).toLocaleDateString()}
                    </Text>

                    <View style={[styles.complainStatus, { backgroundColor: backgroundColor }]}>
                        <Text style={[styles.updateStatus, { color: statusColor, fontWeight: 'bold' }]}>
                            {status.toUpperCase()}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const Complain = ({ navigation }) => {

    const [showModal, setShowModal] = useState(false);
    const [complains, setComplains] = useState([]);
    const [newComplain, setNewComplain] = useState('');
    const [filter, setFilter] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [allComplains, setAllComplains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);


    useEffect(() => {
        const fetchComplain = async () => {
            setLoading(true); // 🟡 start spinner
            try {
                const token = await AsyncStorage.getItem('token');
                const response = await axios.get(
                    'https://letsmeet-backend-47lv.onrender.com/api/user-profile/reports',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                const data = response.data.reports;
                setAllComplains(data);
                applyFilter(data, selectedFilter);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };
        fetchComplain();
    }, []);


    const submitComplain = async () => {
        if (!newComplain.trim()) {
            Alert.alert('Validation Error', 'Complain cannot be empty.');
            return;
        }

        try {
            setSaving(true); // 🟢 start spinner

            const token = await AsyncStorage.getItem('token');
            await axios.post(
                'https://letsmeet-backend-47lv.onrender.com/api/user-profile/submit-report',
                { Description: newComplain },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            Alert.alert('Success', 'Your complaint has been submitted.');
            setNewComplain('');
            setShowModal(false);

            const response = await axios.get(
                'https://letsmeet-backend-47lv.onrender.com/api/user-profile/reports',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setComplains(response.data.reports);
        } catch (err) {
            console.log(err);
            Alert.alert('Error', 'Something went wrong while submitting your complaint.');
        } finally {
            setSaving(false); // 🔴 stop spinner
        }
    };


    useEffect(() => {
        applyFilter(allComplains, selectedFilter);
    }, [selectedFilter]);

    const applyFilter = (data, filterStatus) => {
        if (!filterStatus) {
            setComplains(data);
        } else {
            const filtered = data.filter(item => item.status === filterStatus);
            setComplains(filtered);
        }
    };

    const handleFilterChange = (option) => {
        const normalized = option === 'All' ? null : option.toLowerCase().replace(' ', '_');
        setSelectedFilter(normalized);
        setFilter(false);
    };

    return (
        <View style={styles.background}>
            <SafeAreaView style={styles.container}>

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#000" />
                        <Text style={{ marginTop: 8, color: '#444' }}>Loading complaints...</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollView}>
                        <View style={styles.header}>
                            <Text style={styles.desk}>Complain Desk</Text>
                        </View>

                        <View style={styles.complain}>
                            <Text style={styles.myComplain}>My Complain</Text>
                            <TouchableOpacity onPress={() => setFilter(true)}>
                                <Ionicons name="filter" size={16} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.complainCard}>
                            {complains.map((complain) => (
                                <ComplainCard
                                    key={complain.id}
                                    description={complain.description}
                                    status={complain.status}
                                    updatedAt={complain.updated_at}
                                />
                            ))}
                        </View>
                    </ScrollView>
                )}

                <TouchableOpacity style={styles.plus} onPress={() => setShowModal(true)}>
                    <MaterialIcons name="add" size={40} color="#fff" style={styles.add} />
                </TouchableOpacity>

                {/* Filter Modal */}
                {filter && (
                    <Modal animationType="slide" transparent visible={filter} onRequestClose={() => setFilter(false)}>
                        <TouchableOpacity
                            style={styles.filterOptionsContainer}
                            activeOpacity={1}
                            onPressOut={() => setFilter(false)}
                        >
                            <TouchableWithoutFeedback>
                                <View style={styles.filterOptions}>
                                    {['All', 'Pending', 'In Progress', 'Complete'].map((option) => {
                                        const normalized = option === 'All' ? null : option.toLowerCase().replace(' ', '_');
                                        const isActive = selectedFilter === normalized;

                                        return (
                                            <TouchableOpacity key={option} onPress={() => handleFilterChange(option)} style={styles.filterOption}>
                                                <Text style={[styles.filterText, isActive && styles.filterActive]}>
                                                    {option}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </TouchableWithoutFeedback>
                        </TouchableOpacity>
                    </Modal>
                )}

                {/* Complaint Modal */}
                {showModal && (
                    <Modal animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
                        <TouchableOpacity
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setShowModal(false)}
                        >
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>New Complain</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter the complaint"
                                    value={newComplain}
                                    onChangeText={setNewComplain}
                                />
                                <TouchableOpacity style={styles.saveButton} onPress={submitComplain} disabled={saving}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={styles.saveButtonText}>Save</Text>
                                        {saving && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />}
                                    </View>
                                </TouchableOpacity>

                            </View>
                        </TouchableOpacity>
                    </Modal>
                )}
            </SafeAreaView>
        </View>
    );

};

export default Complain;

const styles = StyleSheet.create({
    background: {
        flex: 1,
        resizeMode: 'cover',
        backgroundColor: '#e8effc',
    },
    container: {
        flex: 1,
    },
    scrollView: {
        padding: 16,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 20,
    },
    desk: {
        fontSize: 25,
        fontWeight: 'bold',
    },
    complain: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    myComplain: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#888',
    },
    heading: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    status: {
        fontSize: 20,
        fontWeight: 'bold',
        marginRight: 55,
    },
    complainDescription: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10.0,
    },
    description: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#111',
    },
    updateStatus: {
        fontSize: 12,
        color: '#555',
        marginBottom: 4,
    },
    card: {
        padding: 6,
        minHeight: 90,
        marginVertical: 3,
        borderBottomWidth: 0.5,
        borderRadius: 8,
    },
    plus: {
        width: 60,
        height: 60,
        backgroundColor: '#34495e',
        borderRadius: 30,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 50,
        right: 30,
        zIndex: 999,
        elevation: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', // Semi-transparent black background
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        width: '80%',
        marginHorizontal: 20,
        borderRadius: 10,
        padding: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    input: {
        height: 100,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        textAlignVertical: 'top',
        padding: 10,
        marginBottom: 15,
    },
    saveButton: {
        backgroundColor: '#34495e',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    complainData: {
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    complainStatus: {
        width: 110,
        borderWidth: 1,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#888',
        paddingVertical: 3,
    },

    complainDetails: {
        width: '100%',
    },
    date: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        width: '100%',
    },

    filterOptionsContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        top: 160,
    },
    filterOptions: {
        backgroundColor: '#34495E',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        elevation: 50,
    },
    filterOption: {
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderRadius: 10,
    },
    filterActive: {
        backgroundColor: 'rgba(255,255,255,.29)',
        width: 100,
        paddingVertical: 10,
        borderRadius: 5,
    },
    filterText: { fontSize: 14, color: '#fff' },

    clearFilterButton: {
        marginTop: 2,
        padding: 3,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#e8effc',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },

});
