import { useNavigation, useNavigationState } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Static tab configuration moved outside component
const TABS = [
    { name: 'Home', iconActive: 'home', iconInactive: 'home-outline', label: 'Home' },
    { name: 'MyEvents', iconActive: 'calendar-month', iconInactive: 'calendar-month-outline', label: 'Events' },
    { name: 'Meetings', iconActive: 'card-account-details', iconInactive: 'card-account-details-outline', label: 'Meetings' },
    { name: 'SupportDesk', iconActive: 'message-alert', iconInactive: 'message-alert-outline', label: 'Support' },
];

const BottomTab = () => {
    const navigation = useNavigation();

    // Simplified current screen detection
    const currentScreen = useNavigationState((state) => {
        const layout = state.routes.find(r => r.name === 'Layout');
        return layout?.state?.routes?.[layout.state.index]?.name ?? 'Home';
    });

    // Memoized press handler
    const handlePress = useCallback(
        (tabName) => navigation.navigate('Layout', { screen: tabName }),
        [navigation]
    );

    // Tab item component for readability
    const TabItem = ({ tab, isActive, onPress }) => (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.iconWrapper, isActive && styles.activeTab]}
        >
            <MaterialCommunityIcons
                name={isActive ? tab.iconActive : tab.iconInactive}
                size={26}
                color={isActive ? '#34495e' : '#fff'}
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView edges={['bottom']} style={styles.bottomBarContainer}>
            {TABS.map(tab => (
                <TabItem
                    key={tab.name}
                    tab={tab}
                    isActive={currentScreen === tab.name}
                    onPress={() => handlePress(tab.name)}
                />
            ))}
        </SafeAreaView>
    );
};

export default BottomTab;

const styles = StyleSheet.create({
    bottomBarContainer: {
        height: 60,
        backgroundColor: '#34495e',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 0.3,
        borderTopColor: '#222',
        width: '100%',
        position: 'absolute',
        bottom: 0,
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
        borderRadius: 10,
        width: 70,
    },
    label: {
        fontSize: 12,
        color: '#fff',
        marginTop: 2,
    },
    activeTab: {
        backgroundColor: '#e8effc',
        padding: 9,
        borderRadius: 10,
    },
    activeLabel: {
        color: '#34495e',
        fontWeight: 'bold',
    },
});
