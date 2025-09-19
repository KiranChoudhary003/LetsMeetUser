import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView,
    StyleSheet, StatusBar, useColorScheme, Text, TouchableOpacity, TouchableWithoutFeedback, View, RefreshControl,
} from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const TicketCard = ({ description, status, updatedAt }) => {
    let formattedStatus;

    if (status === 'complete') {
        formattedStatus = 'RESOLVED';
    } else {
        formattedStatus = status.replace(/_/g, ' ').toUpperCase();
    }

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
            <View style={styles.ticketData}>
                <View style={styles.ticketDetails}>
                    <Text style={styles.description}>{description}</Text>
                </View>
                <View style={styles.date}>
                    <View>
                        <Text style={styles.updatedDate}>Updated Date</Text>
                        <Text style={styles.lastDate}>
                            {new Date(updatedAt).toLocaleString("en-US", {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                            })}
                        </Text>
                    </View>

                    <View style={[
                        styles.ticketStatus,
                        { backgroundColor: backgroundColor },
                        { borderColor: borderColor }
                    ]}>
                        <Text style={[styles.updateStatus, { color: statusColor, fontWeight: 'bold' }]}>
                            {formattedStatus}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};


const SupportDesk = () => {

    const [showModal, setShowModal] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [newTicket, setNewTicket] = useState('');
    const [filter, setFilter] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [allTickets, setAllTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);


    useEffect(() => {
        const loadData = async () => {
            const cached = await AsyncStorage.getItem('ticketsData');
            if (cached) {
                const data = JSON.parse(cached);
                setAllTickets(data);
                applyFilter(data, selectedFilter);
            }
            fetchTickets();
        };
        loadData();
    }, []);



    const fetchTickets = async () => {
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
            const data = response.data.reports.sort(
                (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
            );
            setAllTickets(data);
            applyFilter(data, selectedFilter);
            await AsyncStorage.setItem('ticketsData', JSON.stringify(data));
        } catch (error) {
        } finally {
            setLoading(false);
            if (isFirstLoad) setIsFirstLoad(false);
        }
    };

    const submitTicket = async () => {
        if (!newTicket.trim()) {
            Alert.alert('Validation Error', 'Ticket cannot be empty.');
            return;
        }

        try {
            setSaving(true);
            const token = await AsyncStorage.getItem('token');

            await axios.post(
                'https://letsmeet-backend-47lv.onrender.com/api/user-profile/submit-report',
                { Description: newTicket },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            Alert.alert('Success', 'Your ticket has been submitted Successfully.');
            setNewTicket('');
            setShowModal(false);

            await fetchTickets();
        } catch (err) {
            Alert.alert('Error', 'Something went wrong while submitting your ticket.');
        } finally {
            setSaving(false);
        }
    };



    useEffect(() => {
        applyFilter(allTickets, selectedFilter);
    }, [selectedFilter, allTickets]);


    const applyFilter = (data, filterStatus) => {
        if (!filterStatus) {
            setTickets(data);
        } else {
            const filtered = data.filter(
                item => item.status?.toLowerCase() === filterStatus.toLowerCase()
            );
            setTickets(filtered);
        }
    };

    const handleFilterChange = (option) => {
        const normalized = option === 'All'
            ? null
            : option === 'Resolved'
                ? 'complete'
                : option.toLowerCase().replace(' ', '_');

        setSelectedFilter(normalized);
        setFilter(false);
    };

    return (
        <>
            <StatusBar barStyle={useColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.centerContainer}>
                        <View style={styles.eventsLabel}>
                            <Text style={styles.eventsLabelText}>Support Desk</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.ticketHeader}>
                    <Text style={styles.myTickets}>My Tickets</Text>
                    <TouchableOpacity onPress={() => setFilter(true)}>
                        <Ionicons name="filter" size={16} color="#000" />
                    </TouchableOpacity>
                </View>

                {loading && tickets.length === 0 ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#34495e" />
                        <Text style={{ marginTop: 8, color: '#444' }}>Loading tickets...</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollView}
                        refreshControl={
                            <RefreshControl
                                refreshing={loading && !isFirstLoad && tickets.length > 0}
                                onRefresh={fetchTickets}
                                colors={["#34495e"]}
                                tintColor="#34495e"
                            />
                        }>

                        <View style={styles.ticketCard}>
                            {tickets.length === 0 ? (
                                <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>
                                    No tickets found.
                                </Text>
                            ) : (
                                tickets.map((ticket) => (
                                    <TicketCard
                                        key={ticket.id}
                                        description={ticket.description}
                                        status={ticket.status}
                                        updatedAt={ticket.updated_at}
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
                                    {['All', 'Pending', 'In Progress', 'Resolved'].map((option) => {
                                        const normalized = option === 'All'
                                            ? null
                                            : option === 'Resolved'
                                                ? 'complete'
                                                : option.toLowerCase().replace(' ', '_');

                                        const isActive = selectedFilter === normalized;

                                        return (
                                            <TouchableOpacity
                                                key={option}
                                                onPress={() => handleFilterChange(option)}
                                                style={[styles.filterOption, isActive && styles.filterActive]}
                                            >
                                                <Text style={styles.filterText}>
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
                                <Text style={styles.modalTitle}>New Ticket</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter the ticket"
                                    placeholderTextColor="#888"
                                    value={newTicket}
                                    onChangeText={setNewTicket}
                                />
                                <TouchableOpacity style={styles.saveButton} onPress={submitTicket} disabled={saving}>
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

export default SupportDesk;

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
    centerContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    eventsLabel: {
        paddingVertical: 6,
    },
    eventsLabelText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
    },
    ticketHeader: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 10,
        paddingHorizontal: 16,
    },
    myTickets: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#888',
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
    ticketData: {
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    ticketStatus: {
        width: 110,
        borderWidth: 1,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#888',
        paddingVertical: 3,
    },

    ticketDetails: {
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
        top: 170,
    },
    filterOptions: {
        backgroundColor: '#34495E',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        elevation: 50,
        width: 150,
    },
    filterOption: {
        paddingVertical: 10,
        borderRadius: 10,
    },
    filterActive: {
        backgroundColor: 'rgba(255,255,255,.29)',
        width: '100%',
        paddingVertical: 10,
        borderRadius: 10,
    },
    filterText: { fontSize: 14, color: '#fff', marginLeft: 8 },

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
