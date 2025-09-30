import NetInfo from '@react-native-community/netinfo';
import LottieView from 'lottie-react-native';
import React, { createContext, useEffect, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text } from 'react-native';
import networkLost from '../../assets/networkLost.json';

const { width } = Dimensions.get('window');

export const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(true);
    const [showRestored, setShowRestored] = useState(false);

    const bannerAnim = React.useRef(new Animated.Value(-50)).current; 
    const restoredAnim = React.useRef(new Animated.Value(-50)).current; 

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const connectionStatus = state.isConnected && state.isInternetReachable;

            if (!connectionStatus) {
                // Show offline banner immediately
                setIsConnected(false);
                Animated.timing(bannerAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            } else {
                // Hide offline banner
                setIsConnected(true);
                Animated.timing(bannerAnim, {
                    toValue: -50,
                    duration: 300,
                    useNativeDriver: true,
                }).start();

                // Show restored banner only if we were offline
                if (!isConnected) {
                    setShowRestored(true);

                    // Bounce animation
                    Animated.sequence([
                        Animated.timing(restoredAnim, {
                            toValue: 10,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.spring(restoredAnim, {
                            toValue: 0,
                            friction: 5,
                            tension: 100,
                            useNativeDriver: true,
                        }),
                    ]).start();

                    setTimeout(() => {
                        Animated.timing(restoredAnim, {
                            toValue: -50,
                            duration: 400,
                            useNativeDriver: true,
                        }).start(() => setShowRestored(false));
                    }, 2000);
                }
            }
        });

        return () => unsubscribe();
    }, [isConnected]);

    return (
        <NetworkContext.Provider value={{ isConnected }}>
            {children}

            {/* Offline Banner */}
            <Animated.View style={[styles.banner, { transform: [{ translateY: bannerAnim }] }]}>
                <LottieView
                    source={networkLost}
                    autoPlay
                    loop
                    style={{ width: 36, height: 36, marginRight: 10 }}
                />
                <Text style={styles.bannerText}>No Internet Connection</Text>
            </Animated.View>

            {/* Connection Restored Banner */}
            {showRestored && (
                <Animated.View style={[styles.restoredBanner, { transform: [{ translateY: restoredAnim }] }]}>
                    <Text style={styles.restoredText}>Connection Restored</Text>
                </Animated.View>
            )}
        </NetworkContext.Provider>
    );
};

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        width: width,
        height: 50,
        backgroundColor: '#c43828ff',
        zIndex: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 15,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    bannerText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    restoredBanner: {
        position: 'absolute',
        top: 0,
        width: width,
        height: 50,
        backgroundColor: '#27ae60',
        zIndex: 10000,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    restoredText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
