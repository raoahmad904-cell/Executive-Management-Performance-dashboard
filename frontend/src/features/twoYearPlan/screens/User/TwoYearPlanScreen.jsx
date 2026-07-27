import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../../utils/utils.js";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import { runOnJS } from "react-native-reanimated";

import { useNavigation } from "@react-navigation/native";
import SideMenu from "../../../../components/navigation/SideMenu";
import DashboardHeader from "../../../dashboard/components/DashboardHeader";
import {
  getDashboardHeaderTitle,
  getDashboardMenu,
} from "../../../dashboard/config/dashboardMenu";


const SECTIONS = [
  "Sectoral Development Plan",
  "Policy Review",
  "Advisory Notes",
  "Assessment Reports",
  "CDWP/ECNEC Participation",
  "Section Capacity Building",
  "Minister/DCPC Assigned Tasks",
];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const ACCENT = "#0D4429";

/** Two Year Plan editor body (used inside Dashboard or inside standalone shell). */
function TwoYearPlanEditorBody() {
  const [activeYear, setActiveYear] = useState("2025");
  const [openSection, setOpenSection] = useState(null);
  const [activeQuarter, setActiveQuarter] = useState("Q1");
  const [editorData, setEditorData] = useState({});
  const [planId, setPlanId] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [showSubmitSuccessModal, setShowSubmitSuccessModal] = useState(false);

  const richText = useRef(null);

  function dataKey(section, quarter) {
    return `${activeYear}__${section}__${quarter}`;
  }

  function currentHTML() {
    if (!openSection) return "";
    return editorData[dataKey(openSection, activeQuarter)] ?? "";
  }

  function updateHTML(html) {
    if (!openSection) return;
    const k = dataKey(openSection, activeQuarter);
    setEditorData((prev) => ({ ...prev, [k]: html }));
  }

  // Load plan on mount
  useEffect(() => {
    const loadPlan = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}api/two-year-plan`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data._id) {
            setPlanId(data._id);
            setIsSubmitted(data.status === 'Submitted');

            const mappedData = {};
            (data.plan || []).forEach(item => {
              const sec = item.activityArea;
              mappedData[`2025__${sec}__Q1`] = item.quarters[0] || "";
              mappedData[`2025__${sec}__Q2`] = item.quarters[1] || "";
              mappedData[`2025__${sec}__Q3`] = item.quarters[2] || "";
              mappedData[`2025__${sec}__Q4`] = item.quarters[3] || "";
              mappedData[`2026__${sec}__Q1`] = item.quarters[4] || "";
              mappedData[`2026__${sec}__Q2`] = item.quarters[5] || "";
              mappedData[`2026__${sec}__Q3`] = item.quarters[6] || "";
              mappedData[`2026__${sec}__Q4`] = item.quarters[7] || "";
            });
            setEditorData(mappedData);
          }
        }
      } catch (error) {
        console.error("Error loading two-year plan:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPlan();
  }, []);

  const formatPlanForAPI = () => {
    return SECTIONS.map(section => {
      const quarters = [
        editorData[`2025__${section}__Q1`] || "",
        editorData[`2025__${section}__Q2`] || "",
        editorData[`2025__${section}__Q3`] || "",
        editorData[`2025__${section}__Q4`] || "",
        editorData[`2026__${section}__Q1`] || "",
        editorData[`2026__${section}__Q2`] || "",
        editorData[`2026__${section}__Q3`] || "",
        editorData[`2026__${section}__Q4`] || "",
      ];
      return {
        activityArea: section,
        quarters
      };
    });
  };

  async function handleSave() {
    if (isSubmitted) {
      Alert.alert("Locked", "This plan has already been submitted and cannot be modified.");
      return;
    }
    try {
      const token = await AsyncStorage.getItem("token");
      const payload = {
        status: 'Saved',
        plan: formatPlanForAPI()
      };
      if (planId) {
        payload._id = planId;
      }

      const res = await fetch(`${API_BASE_URL}api/two-year-plan/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.plan && data.plan._id) {
          setPlanId(data.plan._id);
        }
        setOpenSection(null);
        setShowSaveSuccessModal(true);
      } else {
        const errJson = await res.json().catch(() => ({}));
        Alert.alert("Error", errJson.error || "Failed to save plan.");
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  }

  function handleSubmit() {
    if (isSubmitted) {
      Alert.alert("Locked", "This plan has already been submitted.");
      return;
    }
    setShowConfirmSubmitModal(true);
  }

  async function executeSubmitPlan() {
    try {
      const token = await AsyncStorage.getItem("token");
      const payload = {
        status: 'Submitted',
        plan: formatPlanForAPI()
      };
      if (planId) {
        payload._id = planId;
      }

      const res = await fetch(`${API_BASE_URL}api/two-year-plan/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.plan && data.plan._id) {
          setPlanId(data.plan._id);
        }
        setIsSubmitted(true);
        setShowSubmitSuccessModal(true);
      } else {
        const errJson = await res.json().catch(() => ({}));
        Alert.alert("Error", errJson.error || "Failed to submit plan.");
      }
    } catch (error) {
      console.error("Error submitting plan:", error);
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 4,
        }}
      >
        <Text
          style={{
            color: ACCENT,
            fontSize: 17,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Member&apos;s Two-Year Rolling Work Plan
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 12,
          paddingVertical: 10,
          gap: 10,
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        {["2025", "2026"].map((year) => (
          <TouchableOpacity
            key={year}
            onPress={() => {
              setActiveYear(year);
              setOpenSection(null);
            }}
            activeOpacity={0.8}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
              backgroundColor: activeYear === year ? ACCENT : "#F3F4F6",
              borderWidth: 1.5,
              borderColor: activeYear === year ? ACCENT : "#E5E7EB",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: activeYear === year ? "#FFFFFF" : "#6B7280",
              }}
            >
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => (
          <TouchableOpacity
            key={section}
            onPress={() => {
              setOpenSection(section);
              setActiveQuarter("Q1");
            }}
            activeOpacity={0.85}
            style={{
              backgroundColor: ACCENT,
              borderRadius: 12,
              paddingHorizontal: 18,
              paddingVertical: 16,
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              elevation: 3,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: "700",
                flex: 1,
                marginRight: 8,
              }}
              numberOfLines={2}
            >
              {section}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ))}

        {!isSubmitted && (
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#F59E0B",
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text style={{ color: ACCENT, fontWeight: "700", fontSize: 14 }}>
              Submit
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={openSection !== null}
        animationType="slide"
        onRequestClose={() => setOpenSection(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            <View
              style={{
                backgroundColor: ACCENT,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => setOpenSection(null)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  marginRight: 14,
                  minWidth: 80,
                  justifyContent: "center",
                }}
              >
                <Ionicons name="arrow-back" size={20} color={ACCENT} />
                <Text
                  style={{
                    color: ACCENT,
                    fontSize: 14,
                    fontWeight: "800",
                    marginLeft: 5,
                  }}
                >
                  Back
                </Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                  numberOfLines={1}
                >
                  {openSection}
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 12,
                    fontWeight: "600",
                    marginTop: 2,
                  }}
                >
                  {activeYear}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                padding: 12,
                gap: 8,
                backgroundColor: "#FFFFFF",
                borderBottomWidth: 1,
                borderBottomColor: "#E5E7EB",
              }}
            >
              {QUARTERS.map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => setActiveQuarter(q)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: activeQuarter === q ? ACCENT : "#D1D5DB",
                    backgroundColor: activeQuarter === q ? ACCENT : "#FFFFFF",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: activeQuarter === q ? "#FFFFFF" : "#374151",
                    }}
                  >
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {!isSubmitted && (
              <RichToolbar
                key={`${activeYear}__${openSection}__${activeQuarter}`}
                editor={richText}
                actions={[
                  actions.setBold,
                  actions.setItalic,
                  actions.setUnderline,
                  actions.insertOrderedList,
                  actions.insertBulletsList,
                ]}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: "#E5E7EB",
                  backgroundColor: "#fff",
                }}
                iconTint="#374151"
                selectedIconTint="#fff"
                selectedButtonStyle={{ backgroundColor: ACCENT, borderRadius: 6, marginHorizontal: 6 }}
                unselectedButtonStyle={{ marginHorizontal: 6 }}
                flatContainerStyle={{ paddingHorizontal: 12, paddingVertical: 4 }}
              />
            )}

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 80 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <RichEditor
                key={`${activeYear}__${openSection}__${activeQuarter}`}
                ref={richText}
                placeholder="Start typing here…"
                initialContentHTML={currentHTML()}
                onChange={updateHTML}
                disabled={isSubmitted}
                editorStyle={{
                  backgroundColor: "#fff",
                  color: "#111827",
                  placeholderColor: "#9CA3AF",
                  contentCSSText: `
                  font-size: 14px;
                  line-height: 22px;
                  padding: 12px;
                `,
                }}
                style={{ minHeight: 300 }}
              />
            </ScrollView>

            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: "#FFFFFF",
                borderTopWidth: 1,
                borderTopColor: "#E5E7EB",
              }}
            >
              {!isSubmitted ? (
                <TouchableOpacity
                  onPress={handleSave}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: "#FBBF24",
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: ACCENT, fontWeight: "700", fontSize: 14 }}>
                    Save
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 13 }}>
                    🔒 You already Submitted Plan So Can't edit it
                  </Text>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── 1. Custom Save Success Modal ────────────────────────────── */}
      <Modal
        visible={showSaveSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSaveSuccessModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 3,
            borderColor: '#0D4429',
            width: '100%',
            maxWidth: 340,
            padding: 8,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 10
          }}>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: 20, alignItems: 'center' }}>
              <View style={{ backgroundColor: '#E6F4EA', borderRadius: 50, padding: 18, marginBottom: 16 }}>
                <Ionicons name="checkmark-circle" size={42} color="#0D4429" />
              </View>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
                Saved
              </Text>

              <Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                Your progress has been saved.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowSaveSuccessModal(false)}
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: '#0D4429',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 2. Custom Submit Confirmation Modal ────────────────────────────── */}
      <Modal
        visible={showConfirmSubmitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmSubmitModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 3,
            borderColor: '#0D4429',
            width: '100%',
            maxWidth: 340,
            padding: 8,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 10
          }}>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: 20, alignItems: 'center' }}>
              <View style={{ backgroundColor: '#FEF3C7', borderRadius: 50, padding: 18, marginBottom: 16 }}>
                <Ionicons name="help-circle" size={42} color="#D97706" />
              </View>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
                Submit Plan
              </Text>

              <Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                Are you sure you want to submit your Two Year Plan? You won't be able to edit it afterwards.
              </Text>

              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowConfirmSubmitModal(false)}
                  style={{
                    flex: 1,
                    height: 48,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#374151', textAlign: 'center' }}>CANCEL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={async () => {
                    setShowConfirmSubmitModal(false);
                    await executeSubmitPlan();
                  }}
                  style={{
                    flex: 1,
                    height: 48,
                    backgroundColor: '#0D4429',
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>SUBMIT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 3. Custom Submitted Success Modal ────────────────────────────── */}
      <Modal
        visible={showSubmitSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubmitSuccessModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 3,
            borderColor: '#0D4429',
            width: '100%',
            maxWidth: 340,
            padding: 8,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 10
          }}>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: 20, alignItems: 'center' }}>
              <View style={{ backgroundColor: '#E6F4EA', borderRadius: 50, padding: 18, marginBottom: 16 }}>
                <Ionicons name="checkmark-circle" size={42} color="#0D4429" />
              </View>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
                Submitted
              </Text>

              <Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                Your Two Year Plan has been submitted successfully.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowSubmitSuccessModal(false)}
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: '#0D4429',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/**
 * @param {object} props
 * @param {import("@react-navigation/native").NavigationProp<any>} props.navigation
 * @param {boolean} [props.embedded] Pass true from DashboardScreen to avoid duplicate header/menu.
 */
export default function TwoYearPlanScreen({ navigation, embedded = false }) {
  const nav = useNavigation();
  useLayoutEffect(() => {
    nav.setOptions({ title: "Two Year Plan - User" });
  }, [nav]);

  const role = "user";
  const roleLabel = "Test User";
  const headerTitle = getDashboardHeaderTitle(role);
  const menuItems = useMemo(() => getDashboardMenu(role), []);

  const [currentUserName, setCurrentUserName] = useState(roleLabel);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState("two-year-plan");
  const [expandedParentIds, setExpandedParentIds] = useState({
    directives: true,
  });
  const [menuSafeAreaKey, setMenuSafeAreaKey] = useState(0);

  useEffect(() => {
    const loadUserName = async () => {
      try {
        const uStr = await AsyncStorage.getItem("user");
        if (uStr) {
          const u = JSON.parse(uStr);
          if (u && u.name) {
            setCurrentUserName(u.name);
          }
        }
      } catch (err) {
        console.error("Error loading user in TwoYearPlanScreen:", err);
      }
    };
    loadUserName();
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const drawerPan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(-12)
        .failOffsetY([-20, 20])
        .onEnd((e) => {
          const farEnough = e.translationX < -56;
          const fastLeft = e.velocityX < -650;
          if (farEnough || fastLeft) {
            runOnJS(closeMenu)();
          }
        }),
    [closeMenu]
  );

  function handleSelectItem(id) {
    setActiveItemId(id);
    setMenuOpen(false);
    navigation.replace("Dashboard", { role: "user", activeItemId: id });
  }

  const content = <TwoYearPlanEditorBody />;

  if (embedded) {
    return <View className="flex-1">{content}</View>;
  }

  return (
    <View className="flex-1 bg-[#F8F9FA]">
      <DashboardHeader
        roleLabel={currentUserName}
        navigation={navigation}
        headerTitle={headerTitle}
        onMenuPress={() => setMenuOpen(true)}
      />

      <View className="flex-1 px-1">{content}</View>

      {menuOpen ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View className="flex-1 flex-row">
              <GestureDetector gesture={drawerPan}>
                <View
                  className="h-full w-[88%] max-w-[380px] overflow-hidden rounded-tr-3xl bg-white shadow-2xl"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 4, height: 0 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    elevation: 16,
                  }}
                >
                  <SideMenu
                    key={menuSafeAreaKey}
                    items={menuItems}
                    activeItemId={activeItemId}
                    onSelectItem={handleSelectItem}
                    expandedParentIds={expandedParentIds}
                    onToggleParent={(parentId) =>
                      setExpandedParentIds((prev) => ({
                        ...prev,
                        [parentId]: !prev[parentId],
                      }))
                    }
                    onClose={closeMenu}
                    userName={currentUserName}
                    userSubtitle={headerTitle}
                    onChangePassword={() => {
                      setMenuOpen(false);
                      navigation.replace("ChangePassword");
                    }}
                    onLogout={() => {
                      setMenuOpen(false);
                      navigation.dispatch(
                        CommonActions.reset({
                          index: 0,
                          routes: [{ name: "Login" }],
                        })
                      );
                    }}
                  />
                </View>
              </GestureDetector>

              <Pressable
                className="flex-1 bg-black/45"
                onPress={closeMenu}
                accessibilityRole="button"
                accessibilityLabel="Dismiss menu"
              />
            </View>
          </GestureHandlerRootView>
        </View>
      ) : null}
    </View>
  );
}