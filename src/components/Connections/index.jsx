import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@react-native-community/blur';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity, TouchableWithoutFeedback,
  useColorScheme,
  View,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';



const { width } = Dimensions.get('window');

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

const Connections = ({ navigation, route }) => {
  const { eventId } = route.params || {};
  const [eventName, setEventName] = useState('');
  const roleInputRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState('Attendees');
  const [search, setSearch] = useState('');
  const [acceptedUsers, setAcceptedUsers] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [requests, setRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [requestStatus, setRequestStatus] = useState({});
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
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [undoCountdown, setUndoCountdown] = useState(5);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permission, setPermission] = useState(true);




  useEffect(() => {
    if (showFilters) {
      const timeout = setTimeout(() => {
        roleInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [showFilters]);

  useEffect(() => {
    let countdownInterval;

    if (showUndo && (undoUser || undoRequestUser)) {
      setUndoCountdown(5);

      countdownInterval = setInterval(() => {
        setUndoCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(countdownInterval);
  }, [showUndo, undoUser, undoRequestUser]);



  const scrollRef = useRef();
  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setSelectedTab(index === 0 ? 'Attendees' : 'Inbox');
  };

  const handleTabPress = (index) => {
    scrollRef.current.scrollTo({ x: width * index, animated: true });
  };

  const attendeesFiltered = allUsers
    .filter(user =>
      user.name.toLowerCase().includes(search.toLowerCase()) &&
      (!sentFilter || user.role === sentFilter)
    )
    .map(user => ({
      ...user,
      requestStatus: requestStatus[user.id] || 'Request',
    }));




  const inboxFiltered = requests.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) &&
    (!requestFilter || user.role === requestFilter)
  );


  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPendingRequests(),
      fetchAllUsers(eventId),
    ]);
    setLoading(false);
    if (isFirstLoad) {
      setIsFirstLoad(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  useEffect(() => {
    if (showUndo) {
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
                await fetch(`${BASE_URL}/api/user-connections/respond/${localUndoUser.id}`, {
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

          setShowUndo(false);
          setUndoUser(null);
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showUndo, acceptedUsers, fadeAnim, undoUser]);



  const fetchPendingRequests = async () => {
    const token = await getToken();
    try {
      const response = await fetch(`${BASE_URL}/api/user-connections/pending-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const formattedRequests = (data.pending_requests || []).map(user => ({
        id: user.id,
        name: [user.first_name, user.middle_name, user.last_name]
          .filter(Boolean)
          .join(' '),
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

  const fetchAllUsers = async (id = null) => {
    const token = await getToken();
    try {
      const query = id ? `?event_id=${id}` : '';
      const response = await fetch(`${BASE_URL}/api/user-events/attended-users${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const formattedUsers = (data.attended_users || []).map(user => ({
        id: user.id,
        name: [user.first_name, user.middle_name, user.last_name]
          .filter(Boolean)
          .join(' '),
        email: user.email,
        image: user.photo,
        linkedin: user.linkedin_url,
        role: user.role,
        preference: user.preference,
      }));
      setAllUsers(formattedUsers);
      setPermission(data.permission);
      setEventName(data.event.name);
      setRequestStatus(prev => {
        const updated = { ...prev };
        formattedUsers.forEach(u => {
          if (!data.pending_requests?.some(r => r.id === u.id)) {
            updated[u.id] = 'Request';
          }
        });
        return updated;
      });
    } catch (err) {
      console.error(err);
    }
  };


  const handleAccept = async (user) => {
    setAcceptedUsers(prev => ({ ...prev, [user.id]: true }));
    setUndoUser(user);
    setShowUndo(true);

    const timer = setTimeout(async () => {
      if (!undoUser || undoUser.id !== user.id) {
        const token = await getToken();
        try {
          await fetch(`${BASE_URL}/api/user-connections/respond/${user.id}`, {
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

  const handleCancel = (user) => {
    setSelectedUser(user);
    setConfirmVisible(true);
  };

  const confirmReject = async () => {
    if (!selectedUser) { return; }
    const token = await getToken();
    try {
      await fetch(`${BASE_URL}/api/user-connections/respond/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'rejected' }),
      });
      setRequests(prev => prev.filter(u => u.id !== selectedUser.id));
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmVisible(false);
      setSelectedUser(null);
    }
  };

  const handleRequestToggle = async (user) => {
    if (requestStatus[user.id] === 'Requested' || pendingRequests[user.id]) { return; }
    setRequestStatus(prev => ({ ...prev, [user.id]: 'Requested' }));
    setUndoRequestUser(user);
    setShowUndo(true);

    const timer = setTimeout(async () => {
      const token = await getToken();
      try {
        await fetch(`${BASE_URL}/api/user-connections/send-request`, {
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
          ? `${BASE_URL}/api/user-connections/respond/${user.id}`
          : `${BASE_URL}/api/user-connections/send-request`;

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

      setUndoRequestUser(null);
    }

    setShowUndo(false);
  };

  const currentFilter = selectedTab === 'Inbox' ? requestFilter : sentFilter;

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
          {selectedTab === 'Inbox' && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                acceptedUsers[item.id] && styles.disabledButton,
              ]}
              onPress={() => handleAccept(item)}
            >
              <Text style={styles.actionButtonText}>
                {acceptedUsers[item.id] ? 'Accepted' : 'Accept'}
              </Text>
            </TouchableOpacity>
          )}

          {selectedTab !== 'Inbox' && permission && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                requestStatus[item.id] === 'Requested' && styles.disabledButton,
              ]}
              onPress={() => handleRequestToggle(item)}
            >
              <Text style={styles.actionButtonText}>
                {requestStatus[item.id] === 'Requested' ? 'Requested' : 'Request'}
              </Text>
            </TouchableOpacity>
          )}

          {selectedTab === 'Inbox' && !acceptedUsers[item.id] && (
            <TouchableOpacity
              style={styles.cancelRequestButton}
              onPress={() => handleCancel(item)}
            >
              <Text style={styles.cancelRequestButtonText}>X</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };


  return (
    <>
      <StatusBar barStyle={useColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#e8effc', }}>
        <View style={styles.header}>
          {/* Top row */}
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="arrow-back-outline" size={24} color="white" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Attendees</Text>

            <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.iconButton}>
              <Ionicons name="filter" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Bottom row */}
          <View style={styles.headerBottomRow}>
            <TouchableOpacity
              onPress={() => {
                if (currentFilter) {
                  selectedTab === 'Inbox' ? setRequestFilter('') : setSentFilter('');
                }
              }}
            >
              {currentFilter ? (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText} numberOfLines={1} ellipsizeMode="tail">
                    {currentFilter}
                  </Text>
                  <Ionicons name="close-circle" size={18} color="#e8effc" style={styles.closeIcon} />
                </View>
              ) : (
                <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
                  {eventName}
                </Text>
              )}
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
          {['Attendees', 'Inbox'].map((tab, index) => (
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
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={loading && !isFirstLoad && (attendeesFiltered.length > 0 || inboxFiltered.length > 0)}
              onRefresh={fetchData}
              colors={["#34495e"]}
              tintColor="#34495e"
            />
          }
        >

          {/* Attendees Tab */}
          <View style={{ width }}>
            {selectedTab === 'Attendees' && (
              loading && isFirstLoad ? (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <ActivityIndicator size="large" color="#34495e" />
                  <Text style={{ marginTop: 10, fontSize: 16, color: '#333' }}>
                    Loading attendee connections...
                  </Text>
                </View>
              ) : attendeesFiltered.length === 0 ? (
                <View style={styles.filterResultContainer}>
                  <Text style={styles.filterResultText}>No attendees found!</Text>
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
                  data={attendeesFiltered}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                  contentContainerStyle={styles.list}
                  keyboardShouldPersistTaps="handled"
                  initialNumToRender={20}
                  windowSize={5}
                  removeClippedSubviews={true}
                />
              )
            )}
          </View>

          {/* Inbox Tab */}
          <View style={{ width }}>
            {selectedTab === 'Inbox' && (
              loading && isFirstLoad ? (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <ActivityIndicator size="large" color="#34495e" />
                  <Text style={{ marginTop: 10, fontSize: 16, color: '#333' }}>
                    Fetching connection requests...
                  </Text>
                </View>
              ) : inboxFiltered.length === 0 ? (
                <View style={styles.filterResultContainer}>
                  <Text style={styles.filterResultText}>No pending requests found!</Text>
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
                  data={inboxFiltered}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                  contentContainerStyle={styles.list}
                  keyboardShouldPersistTaps="handled"
                  initialNumToRender={20}
                  windowSize={5}
                  removeClippedSubviews={true}
                />
              )
            )}
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

            <View style={styles.undoRightContainer}>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownText}>{undoCountdown}</Text>
              </View>
              <TouchableOpacity onPress={handleUndo} style={styles.undoButtonContainer}>
                <Text style={styles.undoButton}>Undo</Text>
              </TouchableOpacity>
            </View>
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
                    const activeUsers = selectedTab === 'Inbox' ? requests : allUsers;
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
                                    selectedTab === 'Inbox'
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

        <Modal
          visible={confirmVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmVisible(false)}
        >
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>Confirm Action</Text>
              {selectedUser && (
                <Text style={styles.message}>
                  Are you sure you want to delete{" "}
                  <Text style={{ fontWeight: '700' }}>{selectedUser.name}</Text>'s request?
                </Text>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setConfirmVisible(false)}
                >
                  <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.rejectButton]}
                  onPress={confirmReject}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );

};

export default Connections;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    backgroundColor: '#34495E',
    height: 70,
    justifyContent: 'center',
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerBottomRow: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 200,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  filterBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    backgroundColor: '#e8effc',
    paddingHorizontal: 10,
    borderRadius: 12,
    lineHeight: 18,
  },

  closeIcon: {
    marginLeft: 4,
  },

  iconButton: {
    paddingLeft: 8,
    paddingRight: 8,
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

  cancelRequestButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  cancelRequestButtonText: {
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
    backgroundColor: '#fff',
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

  undoButtonContainer: {
    backgroundColor: '#34495e',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  undoButton: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  undoRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  countdownCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
  },

  countdownText: {
    color: '#34495e',
    fontWeight: 'bold',
    fontSize: 14,
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#34495e',
  },
  message: {
    fontSize: 15,
    color: '#555',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#fff',
  },
  cancelText: {
    color: '#34495e',
  },
});