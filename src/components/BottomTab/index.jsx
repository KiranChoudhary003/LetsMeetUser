import { useNavigation, useNavigationState } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const TABS = [
    { name: 'Home', iconActive: 'home', iconInactive: 'home-outline', label: 'Home' },
    { name: 'MyEvents', iconActive: 'calendar-month', iconInactive: 'calendar-month-outline', label: 'Events' },
    { name: 'Meetings', iconActive: 'card-account-details', iconInactive: 'card-account-details-outline', label: 'Meetings' },
    { name: 'SupportDesk', iconActive: 'message-alert', iconInactive: 'message-alert-outline', label: 'Support' },
];

// Memoized TabItem
const TabItem = React.memo(({ tab, isActive, onPress }) => {
    const iconName = isActive ? tab.iconActive : tab.iconInactive;
    const iconColor = isActive ? '#34495e' : '#fff';
    const wrapperStyle = isActive ? [styles.iconWrapper, styles.activeTab] : styles.iconWrapper;
    const labelStyle = isActive ? [styles.label, styles.activeLabel] : styles.label;

    return (
        <TouchableOpacity onPress={onPress} style={wrapperStyle}>
            <MaterialCommunityIcons name={iconName} size={26} color={iconColor} />
            <Text style={labelStyle}>{tab.label}</Text>
        </TouchableOpacity>
    );
}, (prev, next) => prev.isActive === next.isActive);

const BottomTab = () => {
    const navigation = useNavigation();
    const [currentScreen, setCurrentScreen] = useState('Home');

    // Pre-create tab components in a ref (only once)
    const tabRefs = useRef(
        TABS.map((tab) => ({
            tab,
            onPress: () => handlePress(tab.name),
            isActive: false,
        }))
    );

    // Optimized current screen detection
    const screenName = useNavigationState((state) => {
        const layoutState = state.routes[0]?.state;
        return layoutState?.routes?.[layoutState.index]?.name ?? 'Home';
    });

    // Update active state when navigation changes
    useEffect(() => {
        setCurrentScreen(screenName);
    }, [screenName]);

    // Memoized navigation function
    const handlePress = useCallback(
        (tabName) => navigation.navigate('Layout', { screen: tabName }),
        [navigation]
    );

    return (
        <SafeAreaView edges={['bottom']} style={styles.bottomBarContainer}>
            {tabRefs.current.map(({ tab, onPress }) => (
                <TabItem
                    key={tab.name}
                    tab={tab}
                    isActive={currentScreen === tab.name}
                    onPress={onPress}
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
        width: 75,
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
