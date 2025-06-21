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
  Platform,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';


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
      }, 300); // Give modal time to render
      return () => clearTimeout(timeout);
    }
  }, [showFilters]);


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

      // 👇 Capture snapshot of undoUser
      const localUndoUser = undoUser;

      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // ✅ Use localUndoUser here instead of undoUser
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
                console.error('Error finalizing acceptance:', err);
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
      console.error('Failed to fetch pending requests:', err);
    }
  };

  const fetchAllUsers = async () => {
    const token = await getToken();
    try {
      const response = await fetch(`${API_URL}/user-events/attended-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      // ✅ Log the full data once to inspect
      console.log('Raw attended_users response:', data.attended_users);

      const formattedUsers = (data.attended_users || []).map(user => {
        // ✅ Log each user's preference value
        console.log(`User ${user.id} preference:`, user.preference);

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
      console.error('Failed to fetch users:', err);
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
          console.error('Error accepting request:', err);
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
              console.error('Error rejecting request:', err);
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
        console.error('Error sending request:', err);
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
        console.error(`Error finalizing ${type}:`, err);
      }
    };

    (async () => {
      if (undoUser && pendingAccepts[undoUser.id]) {
        clearTimeout(pendingAccepts[undoUser.id]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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


  // Inside renderItem function
  const renderItem = ({ item }) => {
    const transformedUser = {
      first_name: item.name?.split(' ')[0] || '',
      last_name: item.name?.split(' ')[1] || '',
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


    // Handle profile image click
    const handleImagePress = () => {
      const imgUri =
        item.image && item.image.length > 100
          ? item.image.startsWith('data:image')
            ? item.image
            : `data:image/png;base64,${item.image}`
          : '';
      setPreviewImage(imgUri);     // full image or undefined
      setPreviewName(initials);    // <--- also set initials fallback
      setProfileView(true);        // open modal
    };


    return (
      <View style={styles.card}>
        <View style={styles.userInfoRow}>
          {/* Profile Image */}
          <TouchableOpacity onPress={handleImagePress}>
            <View style={styles.circle}>
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

          {/* Name (Navigates to Profile) */}
          <TouchableOpacity
            onPress={() => navigation.navigate('UserProfile', { user: transformedUser })}
          >
            <Text style={styles.text}>{highlightText(item.name, search)}</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.Buttons}>
          <TouchableOpacity
            style={[
              styles.acceptBtn,
              requestStatus[item.id] === 'Requested' && styles.acceptedBtn,
            ]}
            onPress={() =>
              selectedTab === 'Requests' ? handleAccept(item) : handleRequestToggle(item)
            }
          >
            <Text style={styles.acceptText}>
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
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
              <Text style={styles.cancelText}>X</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headingContainer}>
          <View>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.titleContainer}>
            <View>
              <Text style={styles.title}>Connections</Text>
            </View>
            <View style={styles.selectedFilterContainer}>
              <TouchableOpacity
                onPress={() => {
                  if (currentFilter) {
                    selectedTab === 'Requests' ? setRequestFilter('') : setSentFilter('');
                  }
                }}
                style={styles.clearFilterButton}
              >
                <Text style={styles.selectedFilter} numberOfLines={1} ellipsizeMode="tail">
                  {currentFilter || 'Global'}
                  {currentFilter ? ' ×' : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View>
            <TouchableOpacity onPress={() => setShowFilters(true)}>
              <View style={styles.filterContainer}>
                <View style={styles.filterIcon}>
                  <Ionicons name="filter" size={16} color="white" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
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
          {['Requests', 'Connections req. sent'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ marginTop: 10, fontSize: 16, color: '#333' }}>
              Fetching connections...
            </Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.filterResultContainer}>
            <Text style={styles.filterResultText}>
              {selectedTab === 'Requests' ? 'No pending requests found!' : 'No connections found!'}
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
            data={filteredUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {showUndo && (undoUser || undoRequestUser) && (
          <Animated.View style={[styles.undoContainer, { opacity: fadeAnim }]}>
            <Text style={styles.undoText}>
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
                                  <Text style={styles.filterText}>{role}</Text>
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
            <Text style={styles.toastText}>{toast}</Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );

};

export default Connections;


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8EFFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, backgroundColor: '#E8EFFC' },
  fullFlex: {
    flex: 1,
  },
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#34495E',
    paddingBottom: 5,
    paddingTop: 10,
  },
  titleContainer: {
    color: '#ffffff',
    alignItems: 'center',
    paddingLeft: 18,
    minHeight: 58,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  selectedFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedFilter: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  clearFilterButton: {
    marginTop: 2,
    padding: 3,
    backgroundColor: '#34495E',
    borderBottomWidth: 1.5,
    borderColor: 'white',
  },
  highlightText: {
    fontWeight: 'bold',
  },

  highlightSearch: {
    backgroundColor: '#e8e7e7',
    color: '#209dec',
    fontWeight: 'bold',
  },
  searchContainer: {
    marginTop: 24,
    paddingHorizontal: 15,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterResultContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  filterResultText: {
    fontSize: 16,
    color: '#555',
  },
  searchBar: {
    marginTop: 15,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 25,
    backgroundColor: '#f9f9f9f7',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },

  filterButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
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
    paddingRight: 10, // space for the clear icon
    backgroundColor: '#f9f9f9f7',
    color: '#000',
  },

  clearIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -9 }], // vertical centering
    zIndex: 1,
  },

  filterIcon: {
    marginHorizontal: 6,
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
  filterText: { fontSize: 14, color: '#fff' },
  noUsersText: {
    fontSize: 14,
    color: 'white',
    paddingVertical: 12,
    paddingHorizontal: 8,
    textAlign: 'center',
  },

  clearText: {
    color: '#555',
    fontSize: 16,
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
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
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: '#000',
  },
  tabText: {
    color: '#777',
    fontWeight: '400',
    lineHeight: 15,
    letterSpacing: 0,
    fontSize: 14,
  },
  activeTabText: {
    color: '#000',
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 80,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  card: {
    backgroundColor: '#E8EFFC',
    borderBottomWidth: 0.5,
    borderRadius: 5,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  circle: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#444',
    marginRight: 10,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  text: {
    fontSize: 16,
    color: '#000',
    textAlign: 'left',
    flexShrink: 1,
  },
  Buttons: {
    flexDirection: 'row',
    gap: 2,
    alignSelf: 'center',
  },

  acceptBtn: {
    marginRight: 12,
    height: 25,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: 'transparent',
  },

  acceptText: {
    color: 'black',
    fontWeight: '500',
    fontSize: 11,
  },

  acceptedBtn: {
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e1',
    borderWidth: 1,
  },

  cancelBtn: {
    height: 25,
    width: 30,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 100,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  cancelText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },

  acceptedText: {
    color: '#1e293b',
    fontWeight: '500',
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

  bgLightGreen: {
    backgroundColor: 'rgba(216, 252, 132, 0.3)',
  },
  bgLightBlue: {
    backgroundColor: 'rgba(126, 139, 255, 0.2)',
  },
  blur: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },

  initialsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 35,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  fullImage: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  fullImageFallback: {
    backgroundColor: '#211e1e',
    justifyContent: 'center',
    alignItems: 'center',
    width: 300,
    height: 300,
    borderRadius: 150,
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
});
