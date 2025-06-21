import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-gesture-handler';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const BottomTab = () => {

    const navigation = useNavigation();

    return (
        <View style={styles.bottomBarContainer}>
            <TouchableOpacity onPress={() => { navigation.navigate('Layout', { screen: 'Home' }); }}>
                <MaterialIcons name="calendar-today" size={30} color="#4CAF50" style={styles.bottomIconleft} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { navigation.navigate('Layout', { screen: 'MyEvents' }); }}>
                <MaterialIcons name="event" size={30} color="#4CAF50" style={styles.bottomIconleft} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { navigation.navigate('Layout', { screen: 'Complain' }); }}>
                <MaterialIcons name="report" size={30} color="#4CAF50" style={styles.bottomIconleft} />
            </TouchableOpacity>
        </View>
    );
};

export default BottomTab;

const styles = StyleSheet.create({
    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: '#34495e',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
        overflow: 'visible',
        width: '100%',
    },
    bottomIconleft:
    {
        fontSize: 24,
        color: 'white',
    },
    bottomIconright:
    {
        fontSize: 24,
        right: -25,
        color: 'white',
    },
});
