import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated,
  FlatList,
  Image,
  Modal, ScrollView,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity, TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  useColorScheme,
  Platform,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';
import { Dimensions } from 'react-native';



const { width } = Dimensions.get('window');
const API_URL = 'https://letsmeet-backend-47lv.onrender.com/api';

const getToken = async () => {
  return AsyncStorage.getItem('token');
};

const highlightText = (text, highlight) => {
  if (!highlight) { return <Text style={styles.highlightText}>{text}</Text>; }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <Text style={styles.highlightText}>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <Text key={`highlight-${index}`} style={styles.highlightSearch}>{part}</Text>
        ) : (
          <Text key={`normal-${index}`}>{part}</Text>
        )
      )}
    </Text>
  );
};

const Connections = ({ navigation }) => {
  const roleInputRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState('Requests');
  const [search, setSearch] = useState('');
  const [acceptedUsers, setAcceptedUsers] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [requests, setRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [requestStatus, setRequestStatus] = useState({});
  const [toast, setToast] = useState('');
  const [undoUser, setUndoUser] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pendingAccepts, setPendingAccepts] = useState({});
  const [pendingRequests, setPendingRequests] = useState({});
  const [undoRequestUser, setUndoRequestUser] = useState(null);
  const [requestFilter, setRequestFilter] = useState('');
  const [profileView, setProfileView] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [sentFilter, setSentFilter] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (showFilters) {
      const timeout = setTimeout(() => {
        roleInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [showFilters]);


  const scrollRef = useRef();

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setSelectedTab(index === 0 ? 'Requests' : 'Connections req. sent');
  };

  const handleTabPress = (index) => {
    setSelectedTab(index === 0 ? 'Requests' : 'Connections req. sent');
    scrollRef.current.scrollTo({ x: width * index, animated: true });
  };

  const requestsFiltered = requests.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) &&
    (!requestFilter || user.role === requestFilter)
  );

  const connectionsFiltered = allUsers.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) &&
    (!sentFilter || user.role === sentFilter)
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPendingRequests(),
        fetchAllUsers(),
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (toast || showUndo) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const localUndoUser = undoUser;

      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          if (localUndoUser && acceptedUsers[localUndoUser.id]) {
            (async () => {
              const token = await getToken();
              try {
                await fetch(`${API_URL}/user-connections/respond/${localUndoUser.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ action: 'approved' }),
                });
                setRequests(prev => prev.filter(u => u.id !== localUndoUser.id));
              } catch (err) {
              }
            })();
          }

          setToast('');
          setShowUndo(false);
          setUndoUser(null);
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [toast, showUndo, acceptedUsers, fadeAnim, undoUser]);



  const fetchPendingRequests = async () => {
    const token = await getToken();
    try {
      const response = await fetch(`${API_URL}/user-connections/pending-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const formattedRequests = (data.pending_requests || []).map(user => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        role: user.role,
        image: user.photo,
        email: user.email,
        linkedin: user.linkedin_url,
        created_at: user.created_at,
        preference: user.preference,
      }));
      setRequests(formattedRequests);
    } catch (err) {
    }
  };

  const fetchAllUsers = async () => {
    const token = await getToken();
    try {
      const response = await fetch(`${API_URL}/user-events/attended-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      const formattedUsers = (data.attended_users || []).map(user => {

        return {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          image: user.photo,
          linkedin: user.linkedin_url,
          role: user.role,
          preference: user.preference,
        };
      });

      setAllUsers(formattedUsers);
    } catch (err) {
    }
  };


  const handleAccept = async (user) => {
    setAcceptedUsers(prev => ({ ...prev, [user.id]: true }));
    setUndoUser(user);
    setShowUndo(true);
    setToast(`Accepted ${user.name}'s request`);

    const timer = setTimeout(async () => {
      if (!undoUser || undoUser.id !== user.id) {
        const token = await getToken();
        try {
          await fetch(`${API_URL}/user-connections/respond/${user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: 'approved' }),
          });
          setRequests(prev => prev.filter(u => u.id !== user.id));
          setUndoUser(null);
        } catch (err) {
        }
      }
    }, 5000);

    setPendingAccepts(prev => ({ ...prev, [user.id]: timer }));
  };

  const handleCancel = async (user) => {
    Alert.alert(
      'Confirm Rejection',
      `Are you sure you want to reject ${user.name}'s request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            const token = await getToken();
            try {
              await fetch(`${API_URL}/user-connections/respond/${user.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action: 'rejected' }),
              });
              setRequests(prev => prev.filter(u => u.id !== user.id));
              setToast(`Rejected ${user.name}'s request`);
            } catch (err) {
            }
          },
        },
      ]
    );
  };

  const handleRequestToggle = async (user) => {
    if (requestStatus[user.id] === 'Requested' || pendingRequests[user.id]) { return; }
    setRequestStatus(prev => ({ ...prev, [user.id]: 'Requested' }));
    setUndoRequestUser(user);
    setShowUndo(true);
    setToast(`Request sent to ${user.name}`);

    const timer = setTimeout(async () => {
      const token = await getToken();
      try {
        await fetch(`${API_URL}/user-connections/send-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ receiver_id: user.id }),
        });
        setUndoRequestUser(null);
      } catch (err) {
      }

      setPendingRequests(prev => {
        const updated = { ...prev };
        delete updated[user.id];
        return updated;
      });

    }, 5000);

    setPendingRequests(prev => ({ ...prev, [user.id]: timer }));
  };

  useEffect(() => {
    const finalizeAction = async (user, type) => {
      const token = await getToken();
      const url =
        type === 'accept'
          ? `${API_URL}/user-connections/respond/${user.id}`
          : `${API_URL}/user-connections/send-request`;

      const method = type === 'accept' ? 'PUT' : 'POST';
      const body =
        type === 'accept'
          ? JSON.stringify({ action: 'approved' })
          : JSON.stringify({ receiver_id: user.id });

      try {
        await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body,
        });

        if (type === 'accept') {
          setRequests(prev => prev.filter(u => u.id !== user.id));
        }
      } catch (err) {
      }
    };

    (async () => {
      if (undoUser && pendingAccepts[undoUser.id]) {
        clearTimeout(pendingAccepts[undoUser.id]);
        setPendingAccepts(prev => {
          const updated = { ...prev };
          delete updated[undoUser.id];
          return updated;
        });

        await finalizeAction(undoUser, 'accept');
      }
      if (undoRequestUser && pendingRequests[undoRequestUser.id]) {
        clearTimeout(pendingRequests[undoRequestUser.id]);
        await finalizeAction(undoRequestUser, 'request');
      }

      setUndoUser(null);
      setUndoRequestUser(null);
      setShowUndo(false);
      setToast('');
    })();
  }, [selectedTab]);

  const handleUndo = () => {
    if (undoUser && pendingAccepts[undoUser.id]) {
      clearTimeout(pendingAccepts[undoUser.id]);
    }

    if (undoUser) {
      setAcceptedUsers(prev => {
        const updated = { ...prev };
        delete updated[undoUser.id];
        return updated;
      });

      setRequests(prev => {
        const exists = prev.some(user => user.id === undoUser.id);
        if (!exists) { return [undoUser, ...prev]; }
        return prev;
      });

      setToast(`Undo accepted for ${undoUser.name}`);
      setUndoUser(null);
    }

    if (undoRequestUser && pendingRequests[undoRequestUser.id]) {
      clearTimeout(pendingRequests[undoRequestUser.id]);
    }

    if (undoRequestUser) {
      setRequestStatus(prev => {
        const updated = { ...prev };
        delete updated[undoRequestUser.id];
        return updated;
      });

      setPendingRequests(prev => {
        const updated = { ...prev };
        delete updated[undoRequestUser.id];
        return updated;
      });

      setToast(`Undo request to ${undoRequestUser.name}`);
      setUndoRequestUser(null);
    }

    setShowUndo(false);
  };

  const currentFilter = selectedTab === 'Requests' ? requestFilter : sentFilter;

  const filteredUsers =
    selectedTab === 'Requests'
      ? requests.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) &&
        (!requestFilter || user.role === requestFilter)
      )
      : allUsers.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) &&
        (!sentFilter || user.role === sentFilter)
      );

  const renderItem = ({ item }) => {
    const transformedUser = {
      first_name: item.name || '',
      attendees_role: item.role || '',
      photo:
        item.image && item.image.length > 100
          ? item.image.startsWith('data:image')
            ? item.image
            : `data:image/png;base64,${item.image}`
          : '',
      email: item.email || '',
      linkedin_url: item.linkedin || '',
      preference: Array.isArray(item.preference) ? item.preference : [],
    };

    const initials =
      typeof item.name === 'string' && item.name.trim().length > 0
        ? item.name
          .split(' ')
          .map((w) => w?.[0] || '')
          .join('')
          .toUpperCase()
        : 'NA';

    const handleImagePress = () => {
      const imgUri =
        item.image && item.image.length > 100
          ? item.image.startsWith('data:image')
            ? item.image
            : `data:image/png;base64,${item.image}`
          : '';
      setPreviewImage(imgUri);
      setPreviewName(initials);
      setProfileView(true);
    };


    return (
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <TouchableOpacity onPress={handleImagePress}>
            <View style={styles.profileCircle}>
              {item.image && item.image.length > 100 ? (
                <Image
                  source={{
                    uri: item.image.startsWith('data:image')
                      ? item.image
                      : `data:image/png;base64,${item.image}`,
                  }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.initialsText}>{initials}</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('UserProfile', { user: transformedUser })}
            style={{ flex: 1 }}
          >
            <Text style={styles.nameText} numberOfLines={1} ellipsizeMode="tail">
              {highlightText(item.name, search)}
            </Text>
            <Text style={styles.roleText} numberOfLines={1}>
              {item.role}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              requestStatus[item.id] === 'Requested' && styles.disabledButton,
            ]}
            onPress={() =>
              selectedTab === 'Requests' ? handleAccept(item) : handleRequestToggle(item)
            }
          >
            <Text style={styles.actionButtonText}>
              {selectedTab === 'Requests'
                ? acceptedUsers[item.id]
                  ? 'Accepted'
                  : 'Accept'
                : requestStatus[item.id] === 'Requested'
                  ? 'Requested'
                  : 'Request'}
            </Text>
          </TouchableOpacity>

          {selectedTab === 'Requests' && !acceptedUsers[item.id] && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(item)}
            >
              <Text style={styles.cancelButtonText}>X</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };


  return (
    <>
      <StatusBar barStyle={useColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#e8effc',}}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="arrow-back-outline" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Connections</Text>
              <TouchableOpacity
                onPress={() => {
                  if (currentFilter) {
                    selectedTab === 'Requests' ? setRequestFilter('') : setSentFilter('');
                  }
                }}
              >
                <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
                  {currentFilter || 'Global'}
                  {currentFilter ? ' ×' : ''}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.iconButton}>
              <Ionicons name="filter" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Entypo name="magnifying-glass" size={24} color="black" />
            <TextInput
              placeholder="Search user..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              placeholderTextColor="#888"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Entypo name="cross" size={24} color="black" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tabs}>
            {['Requests', 'Connections req. sent'].map((tab, index) => (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabPress(index)}
                style={[styles.tab, selectedTab === tab && styles.activeTab]}
              >
                <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>


          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={{ width }}>
              {loading ? (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <ActivityIndicator size="large" color="#34495e" />
                  <Text style={{ marginTop: 10, fontSize: 16, color: '#333' }}>
                    Fetching connections...
                  </Text>
                </View>
              ) : (requestsFiltered.length === 0 ? (
                <View style={styles.filterResultContainer}>
                  <Text style={styles.filterResultText}>
                    No pending requests found!
                  </Text>
                  <LottieView
                    style={styles.lottieContainer}
                    source={require('../../assets/Not-Found.json')}
                    autoPlay
                    loop
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <FlatList
                  data={requestsFiltered}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                  contentContainerStyle={styles.list}
                  keyboardShouldPersistTaps="handled"
                />
              ))}
            </View>

            <View style={{ width }}>
              {loading ? (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <ActivityIndicator size="large" color="#34495e" />
                  <Text style={{ marginTop: 10, fontSize: 16, color: '#333' }}>
                    Fetching connections...
                  </Text>
                </View>
              ) : (connectionsFiltered.length === 0 ? (
                <View style={styles.filterResultContainer}>
                  <Text style={styles.filterResultText}>
                    No connections found!
                  </Text>
                  <LottieView
                    style={styles.lottieContainer}
                    source={require('../../assets/Not-Found.json')}
                    autoPlay
                    loop
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <FlatList
                  data={connectionsFiltered}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                  contentContainerStyle={styles.list}
                  keyboardShouldPersistTaps="handled"
                />
              ))}
            </View>
          </ScrollView>


          {showUndo && (undoUser || undoRequestUser) && (
            <Animated.View style={[styles.undoContainer, { opacity: fadeAnim }]}>
              <Text
                style={styles.undoText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {undoUser
                  ? `Accepted ${undoUser.name}`
                  : `Sent request to ${undoRequestUser.name}`}
              </Text>
              <TouchableOpacity onPress={handleUndo}>
                <Text style={styles.undoButton}>Undo</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {showFilters && (
            <Modal animationType="fade" transparent visible={showFilters}>
              <TouchableOpacity
                style={styles.filterOptionsContainer}
                activeOpacity={1}
                onPressOut={() => setShowFilters(false)}
              >
                <TouchableWithoutFeedback>
                  <View style={styles.filterOptions}>
                    {(() => {
                      const activeUsers = selectedTab === 'Requests' ? requests : allUsers;
                      if (activeUsers.length === 0) {
                        return <Text style={styles.noUsersText}>No users available to filter</Text>;
                      }
                      const uniqueRoles = [...new Set(activeUsers.map(user => user.role).filter(Boolean))];

                      if (uniqueRoles.length === 0) {
                        return <Text style={styles.noUsersText}>No role filters available</Text>;
                      }
                      const filteredRoles = uniqueRoles.filter(role =>
                        role.toLowerCase().includes(roleSearch.toLowerCase())
                      );
                      const itemHeight = 35;
                      const visibleItemCount = Math.min(filteredRoles.length, 5);
                      const containerHeight = itemHeight * visibleItemCount;
                      return (
                        <>
                          <View style={styles.roleSearchWrapper}>
                            <TextInput
                              ref={roleInputRef}
                              placeholder="Search role..."
                              value={roleSearch}
                              onChangeText={setRoleSearch}
                              style={styles.roleSearchInput}
                              placeholderTextColor="#888"
                            />
                            {roleSearch.length > 0 && (
                              <TouchableOpacity onPress={() => setRoleSearch('')} style={styles.clearIcon}>
                                <Entypo name="cross" size={18} color="#888" />
                              </TouchableOpacity>
                            )}
                          </View>
                          {filteredRoles.length === 0 ? (
                            <Text style={styles.noUsersText}>No role found</Text>
                          ) : (
                            <ScrollView
                              style={{ maxHeight: containerHeight }}
                              nestedScrollEnabled
                              showsVerticalScrollIndicator={false}
                            >
                              {filteredRoles.map((role) => {
                                const isActive = currentFilter === role;
                                return (
                                  <TouchableOpacity
                                    key={role}
                                    style={[
                                      styles.filterOption,
                                      isActive && styles.filterActive,
                                    ]}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                      selectedTab === 'Requests'
                                        ? setRequestFilter(role)
                                        : setSentFilter(role);
                                      setShowFilters(false);
                                      setRoleSearch('');
                                    }}
                                  >
                                    <Text style={styles.filterText}>
                                      {role.toUpperCase()}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          )}
                        </>
                      );
                    })()}
                  </View>
                </TouchableWithoutFeedback>
              </TouchableOpacity>
            </Modal>
          )}

          <Modal visible={profileView} transparent animationType="fade">
            <BlurView
              style={styles.blur}
              blurType="light"
              blurAmount={15}
              reducedTransparencyFallbackColor="white"
            />
            <TouchableOpacity style={styles.modalOverlay} onPressOut={() => setProfileView(false)}>
              <View style={styles.modalContent}>
                {previewImage && previewImage.length > 100 ? (
                  <Image
                    source={{ uri: previewImage }}
                    style={styles.fullImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.circle, styles.fullImageFallback]}>
                    <Text style={styles.initialsPreview}>{previewName}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Modal>

          {toast !== '' && (
            <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
              <Text
                style={styles.toastText}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {toast}
              </Text>
            </Animated.View>
          )}
      </SafeAreaView>
    </>
  );

};

export default Connections;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#34495E',
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 70,
  },

  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  headerSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    marginTop: 2,
    borderBottomWidth: 1.5,
    borderBottomColor: '#ffffff',
  },

  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchBar: {
    marginTop: 15,
    marginHorizontal: width * 0.03,
    paddingHorizontal: width * 0.03,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 25,
    backgroundColor: '#f9f9f9f7',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    paddingHorizontal: Platform.OS === 'ios' ? 4 : 4,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: 10,
  },

  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: width * 0.03,
    alignItems: 'center',
  },

  activeTab: {
    borderBottomWidth: 2,
    borderColor: '#000',
  },

  tabText: {
    color: '#777',
    fontWeight: '400',
    fontSize: 14,
  },

  activeTabText: {
    color: '#000',
    fontWeight: 'bold',
  },

  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.8,
    marginHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 10,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  profileCircle: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: (width * 0.12) / 2,
    backgroundColor: '#34495E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.12) / 2,
  },

  initialsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    maxWidth: width * 0.4,
  },

  roleText: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },

  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#34495e',
  },

  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  disabledButton: {
    backgroundColor: '#d1d5db',
  },

  cancelButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  cancelButtonText: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '700',
  },

  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  filterOptionsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    top: 55,
  },

  filterOptions: {
    backgroundColor: '#34495E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    elevation: 50,
  },

  filterActive: {
    backgroundColor: 'rgba(255,255,255,.29)',
  },

  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 10,
  },

  filterText: {
    fontSize: 14,
    color: '#fff',
  },

  noUsersText: {
    fontSize: 14,
    color: 'white',
    paddingVertical: 12,
    paddingHorizontal: 8,
    textAlign: 'center',
  },

  highlightText: {
    fontWeight: 'bold',
  },

  highlightSearch: {
    backgroundColor: '#e8e7e7',
    color: '#209dec',
    fontWeight: 'bold',
  },

  clearIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -9 }],
    zIndex: 1,
  },

  roleSearchWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 10,
  },

  roleSearchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 10,
    backgroundColor: '#f9f9f9f7',
    color: '#000',
  },

  undoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffffee',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopWidth: 0.5,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
    elevation: 8,
  },

  undoText: {
    color: '#000',
    fontSize: 14,
    maxWidth: 280,
  },

  undoButton: {
    color: '#007BFF',
    fontWeight: '600',
    fontSize: 14,
  },

  toastContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 12,
  },

  toastText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  blur: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },

  fullImage: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },

  fullImageFallback: {
    backgroundColor: '#211e1e',
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },

  initialsPreview: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 150,
    textAlign: 'center',
    lineHeight: 300,
  },

  lottieContainer: {
    marginTop: 50,
    height: 200,
    width: 200,
  },

  filterResultContainer: {
    alignItems: 'center',
    marginTop: 40,
  },

  filterResultText: {
    fontSize: 16,
    color: '#555',
  },
});

