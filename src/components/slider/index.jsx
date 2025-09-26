import React, { useRef, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import QRCodeScreen from "../QRCodeScreen";
import Scanner from "../Scanner";

const { width } = Dimensions.get("window");

const QRCodeSlidePage = ({ navigation }) => {
  const scrollRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState("QRCode");

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setSelectedTab(index === 0 ? "QRCode" : "Scanner");
  };

  const handleTabPress = (index) => {
    scrollRef.current.scrollTo({ x: width * index, animated: true });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#34495e', paddingTop: StatusBar.currentHeight }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabs}>
          {["QRCode", "Scanner"].map((tab, index) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabPress(index)}
              style={styles.tabWrapper}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
              {selectedTab === tab && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Swipe Pages */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={{ width }}>
            <QRCodeScreen navigation={navigation} />
          </View>
          <View style={{ width }}>
            <Scanner navigation={navigation} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView >
  );
};

export default QRCodeSlidePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8effc',
  },
  header: {
    height: 70,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#e8effc",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#e8effc",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  tabWrapper: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#777",
  },
  activeTabText: {
    color: "#34495E",
    fontWeight: "700",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: "40%",
    borderRadius: 2,
    backgroundColor: "#34495E",
  },
});
