import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Platform, StatusBar } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NetworkBanner() {
  const [isConnected, setIsConnected] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;

      if (!online) {
        setIsConnected(false);
        setWasOffline(true);
        setShowRestored(false);
      } else {
        setIsConnected(true);
        if (wasOffline) {
          setShowRestored(true);
          const timer = setTimeout(() => {
            setShowRestored(false);
            setWasOffline(false);
          }, 3500);
          return () => clearTimeout(timer);
        }
      }
    });

    return () => unsubscribe();
  }, [wasOffline]);

  if (isConnected && !showRestored) {
    return null;
  }

  const topInset = Math.max(insets.top, Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topInset + 6,
          backgroundColor: isConnected ? "#15803D" : "#DC2626",
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <Ionicons
          name={isConnected ? "checkmark-circle-outline" : "wifi-outline"}
          size={18}
          color="#FFFFFF"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.text} numberOfLines={1}>
          {isConnected
            ? "Network Connection Restored — Back Online"
            : "No Internet Connection — Please check your network"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    paddingBottom: 8,
    paddingHorizontal: 16,
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
    textAlign: "center",
  },
});
