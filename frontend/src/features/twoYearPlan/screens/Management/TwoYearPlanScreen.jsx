import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useMemo, useState, useEffect } from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../../utils/utils.js";

function SectionHeader({ title, tone = "default" }) {
    const config =
        tone === "success"
            ? {
                  bg: "#DCFCE7",
                  border: "#16A34A",
                  titleColor: "#14532D",
                  pillBg: "#16A34A",
                  pillText: "#FFFFFF",
                  pillLabel: "✓  Submitted",
                  iconName: "checkmark-circle",
                  iconColor: "#16A34A",
              }
            : {
                  bg: "#FEF9C3",
                  border: "#EAB308",
                  titleColor: "#713F12",
                  pillBg: "#EAB308",
                  pillText: "#FFFFFF",
                  pillLabel: "⏳  Pending",
                  iconName: "time-outline",
                  iconColor: "#CA8A04",
              };

    return (
        <View
            style={{
                backgroundColor: config.bg,
                borderLeftWidth: 4,
                borderLeftColor: config.border,
                borderRadius: 12,
                padding: 12,
                marginTop: 16,
                marginBottom: 10,
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", justify: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                    <Ionicons name={config.iconName} size={18} color={config.iconColor} style={{ marginRight: 6 }} />
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: "800",
                            color: config.titleColor,
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                            flexShrink: 1,
                        }}
                        numberOfLines={2}
                    >
                        {title}
                    </Text>
                </View>
                <View
                    style={{
                        backgroundColor: config.pillBg,
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        flexShrink: 0,
                    }}
                >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: config.pillText }}>
                        {config.pillLabel}
                    </Text>
                </View>
            </View>
        </View>
    );
}

function MemberCard({ member, disabled, onPress }) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            disabled={disabled}
            onPress={onPress}
            style={{
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: disabled ? "#E5E7EB" : "#0D4429",
                backgroundColor: disabled ? "#FFFFFF" : "#0D4429",
                opacity: disabled ? 0.65 : 1,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
            }}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            accessibilityLabel={`${member.name}${disabled ? ", not submitted" : ", submitted"}`}
        >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* Avatar circle */}
                <View
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: disabled ? "#F3F4F6" : "rgba(255,255,255,0.15)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                        flexShrink: 0,
                    }}
                >
                    <Ionicons
                        name={disabled ? "lock-closed-outline" : "person-outline"}
                        size={16}
                        color={disabled ? "#9CA3AF" : "#FFFFFF"}
                    />
                </View>

                {/* Text block */}
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: disabled ? "#111827" : "#FFFFFF",
                        }}
                        numberOfLines={2}
                    >
                        {member.name}
                    </Text>
                    <Text
                        style={{
                            fontSize: 11,
                            color: disabled ? "#6B7280" : "rgba(255,255,255,0.75)",
                            marginTop: 2,
                        }}
                        numberOfLines={1}
                    >
                        {member.email}
                    </Text>
                </View>

                {/* Right icon */}
                <View style={{ flexShrink: 0, marginLeft: 6 }}>
                    <Ionicons
                        name={disabled ? "ellipsis-horizontal" : "chevron-forward"}
                        size={18}
                        color={disabled ? "#D1D5DB" : "#FFFFFF"}
                    />
                </View>
            </View>

            {/* Bottom status row */}
            <View
                style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: disabled ? "#F3F4F6" : "rgba(255,255,255,0.15)",
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <Ionicons
                    name={disabled ? "ban-outline" : "eye-outline"}
                    size={13}
                    color={disabled ? "#9CA3AF" : "rgba(255,255,255,0.7)"}
                    style={{ marginRight: 5 }}
                />
                <Text
                    style={{
                        fontSize: 11,
                        color: disabled ? "#9CA3AF" : "rgba(255,255,255,0.7)",
                    }}
                >
                    {disabled ? "Disabled — plan not yet submitted" : "Tap to view full plan details"}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export default function TwoYearPlanScreen({ navigation }) {
    const nav = useNavigation();
    useLayoutEffect(() => {
      nav.setOptions({ title: "Two Year Plan" });
    }, [nav]);

    const [submitted, setSubmitted] = useState([]);
    const [notSubmitted, setNotSubmitted] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const token = await AsyncStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}api/dashboard/two-year-stats`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    
                    const mappedSubmitted = (data.submitted || []).map(u => ({
                        id: u._id,
                        name: u.name,
                        email: u.email,
                        submittedAt: "Submitted"
                    }));
                    const mappedNotSubmitted = (data.notSubmitted || []).map(u => ({
                        id: u._id,
                        name: u.name,
                        email: u.email
                    }));
                    
                    setSubmitted(mappedSubmitted);
                    setNotSubmitted(mappedNotSubmitted);
                }
            } catch (err) {
                console.error("Error fetching two year plan stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "#0D4429" }}
            contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
        >
            <View
                style={{
                    borderRadius: 24,
                    backgroundColor: "#FFFFFF",
                    padding: 16,
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 10,
                    elevation: 3,
                }}
            >
                {loading ? (
                    <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color="#0D4429" />
                        <Text style={{ marginTop: 12, fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
                            Loading submissions...
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* ── Submitted Section ── */}
                        <SectionHeader
                            title="Members Who Submitted 2 Year Plan"
                            tone="success"
                        />

                        {submitted.length === 0 ? (
                            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                                <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No submissions found.</Text>
                            </View>
                        ) : (
                            submitted.map((item) => (
                                <MemberCard
                                    key={item.id}
                                    member={item}
                                    disabled={false}
                                    onPress={() =>
                                        navigation.navigate("TwoYearPlanMemberDetails", { member: item })
                                    }
                                />
                            ))
                        )}

                        {/* ── Not Submitted Section ── */}
                        <SectionHeader
                            title="Members Who Have Not Submitted 2 Year Plan"
                            tone="warning"
                        />

                        {notSubmitted.length === 0 ? (
                            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                                <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No pending submissions.</Text>
                            </View>
                        ) : (
                            notSubmitted.map((item) => (
                                <MemberCard
                                    key={item.id}
                                    member={item}
                                    disabled={true}
                                    onPress={() => {}}
                                />
                            ))
                        )}
                    </>
                )}
            </View>
        </ScrollView>
    );
}