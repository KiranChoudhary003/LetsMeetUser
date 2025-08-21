import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, StatusBar,useColorScheme,Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ComplainCard = ({ description, status, updatedAt }) => {

    const formattedStatus = status.replace(/_/g, ' ').toUpperCase();
    let statusColor = '#000';
    let backgroundColor = '#fff';
    let borderColor = '#e74c3c';

    if (status === 'pending') {
        backgroundColor = '#f8c8c1';
    } else if (status === 'in_progress') {
        statusColor = '#333';
        backgroundColor = '#fcf3cf';
        borderColor = '#f1c40f';
    } else if (status === 'complete') {
        backgroundColor = '#bdf4c1';
        borderColor = '#07bc0c';
    }

    return (
        <View style={styles.card}>
            <View style={styles.complainData}>
                <View style={styles.complainDetails}>
                    <Text style={styles.description}>{description}</Text>
                </View>
                <View style={styles.date}>
                    <View>
                        <Text style={styles.updatedDate}>Updated Date</Text>
                        <Text style={styles.lastDate}>
                            {new Date(updatedAt).toLocaleDateString()}
                        </Text>
                    </View>

                    <View style={[styles.complainStatus, { backgroundColor: backgroundColor }, { borderColor: borderColor }]}>
                        <Text style={[styles.updateStatus, { color: statusColor, fontWeight: 'bold' }]}>
                            {formattedStatus}
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
        const loadData = async () => {
            const cached = await AsyncStorage.getItem('complaintsData');
            if (cached) {
                const data = JSON.parse(cached);
                setAllComplains(data);
                applyFilter(data, selectedFilter);
            }
            fetchComplains();
        };
        loadData();
    }, []);



    const fetchComplains = async () => {
        setLoading(true);
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
            await AsyncStorage.setItem('complaintsData', JSON.stringify(data));
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const submitComplain = async () => {
        if (!newComplain.trim()) {
            Alert.alert('Validation Error', 'Complain cannot be empty.');
            return;
        }

        try {
            setSaving(true);
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

            await fetchComplains();
        } catch (err) {
            Alert.alert('Error', 'Something went wrong while submitting your complaint.');
        } finally {
            setSaving(false);
        }
    };



    useEffect(() => {
        applyFilter(allComplains, selectedFilter);
    }, [selectedFilter, allComplains]);


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
        <>
             <StatusBar barStyle={useColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.desk}>Complain Desk</Text>
                </View>

                <View style={styles.complain}>
                    <Text style={styles.myComplain}>My Complain</Text>
                    <TouchableOpacity onPress={() => setFilter(true)}>
                        <Ionicons name="filter" size={16} color="#000" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#34495e" />
                        <Text style={{ marginTop: 8, color: '#444' }}>Loading complaints...</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollView}>

                        <View style={styles.complainCard}>
                            {complains.length === 0 ? (
                                <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>
                                    No complaints found.
                                </Text>
                            ) : (
                                complains.map((complain) => (
                                    <ComplainCard
                                        key={complain.id}
                                        description={complain.description}
                                        status={complain.status}
                                        updatedAt={complain.updated_at}
                                    />
                                ))
                            )}
                        </View>
                    </ScrollView>
                )}

                <TouchableOpacity style={styles.plus} onPress={() => setShowModal(true)}>
                    <MaterialIcons name="add" size={40} color="#fff" style={styles.add} />
                </TouchableOpacity>

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
                                    placeholderTextColor="#888"
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
        </>
    );

};

export default Complain;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8effc',
    },
    scrollView: {
        padding: 16,
    },
    header: {
        paddingTop: 16,
        paddingBottom: 8,
        paddingHorizontal: 16,
        position: 'relative',
        alignItems: 'center',
    },
    desk: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        backgroundColor: '#34495e',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#888',
        borderRadius: 20,
        backgroundColor: '#34495e',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    complain: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
        marginHorizontal: 20,
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
        backgroundColor: 'rgba(0,0,0,0.6)',
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
        color: '#34495e',
    },
    input: {
        height: 45,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        textAlignVertical: 'top',
        padding: 10,
        marginBottom: 15,
        color: '#000',
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
        width : 150,
    },
    filterOption: {
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderRadius: 10,
    },
    filterActive: {
        backgroundColor: 'rgba(255,255,255,.29)',
        width: '100%',
        paddingVertical: 10,
        paddingLeft : 5,
        borderRadius: 10,
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
    updatedDate: {
        fontSize: 12,
        color: '#888',
    },
    lastDate: {
        fontSize: 12,
        color: '#888',
    },
});
