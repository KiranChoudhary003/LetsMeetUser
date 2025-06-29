import { useNavigation, useNavigationState } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const BottomTab = () => {
    const navigation = useNavigation();

    const currentScreen = useNavigationState((state) => {
        const layoutTab = state.routes.find((r) => r.name === 'Layout');
        const nestedState = layoutTab?.state;
        const activeRoute = nestedState?.routes[nestedState.index];
        return activeRoute?.name || 'Home';
    });

    const tabs = [
        {
            name: 'Home',
            iconActive: 'home',
            iconInactive: 'home-outline',
            label: 'Home',
        },
        {
            name: 'MyEvents',
            iconActive: 'calendar-month',
            iconInactive: 'calendar-month-outline',
            label: 'Events',
        },
        {
            name: 'Complain',
            iconActive: 'message-alert',
            iconInactive: 'message-alert-outline',
            label: 'Complain',
        },
    ];

    return (
        <View style={styles.bottomBarContainer}>
            {tabs.map((tab) => {
                const isActive = currentScreen === tab.name;

                return (
                    <TouchableOpacity
                        key={tab.name}
                        onPress={() => navigation.navigate('Layout', { screen: tab.name })}
                        style={[styles.iconWrapper, isActive && styles.activeTab]}
                    >
                        <MaterialCommunityIcons
                            name={isActive ? tab.iconActive : tab.iconInactive}
                            size={26}
                            color={isActive ? '#000' : '#fff'} 
                        />
                        <Text style={[styles.label, isActive && styles.activeLabel]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
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
    },
    label: {
        fontSize: 12,
        color: '#fff',
        marginTop: 2,
    },
    activeTab: {
        backgroundColor: '#2c3e50', 
        padding: 8,
        borderRadius: 8,
        transform: [{ scale: 1.1 }],
    },
    activeLabel: {
        color: '#000', 
        fontWeight: 'bold',
        textShadowOffset: { width: 0, height: 0 },
    },
});
