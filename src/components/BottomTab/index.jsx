import { useNavigation, useNavigationState } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const BottomTab = () => {
    const navigation = useNavigation();

    const currentScreen = useNavigationState((state) => {
        const layoutTab = state.routes.find(r => r.name === 'Layout');
        const nestedState = layoutTab?.state;
        const activeRoute = nestedState?.routes[nestedState.index];
        return activeRoute?.name || "Home"
    });

    const tabs = [
        {
            name: 'Home',
            iconActive: 'home',
            iconInactive: 'home-outline',
        },
        {
            name: 'MyEvents',
            iconActive: 'calendar-month',
            iconInactive: 'calendar-month-outline',
        },
        {
            name: 'Complain',
            iconActive: 'message-alert',
            iconInactive: 'message-alert-outline',
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
                        style={styles.iconWrapper}
                    >
                        <MaterialCommunityIcons
                            name={isActive ? tab.iconActive : tab.iconInactive}
                            size={isActive ? 32 : 26}
                            color={'#fff'}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default BottomTab

const styles = StyleSheet.create({
    bottomBarContainer: {
        height: 60,
        backgroundColor: '#34495e',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
        width: '100%',
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
})