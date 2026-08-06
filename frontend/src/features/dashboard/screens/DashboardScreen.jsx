import { CommonActions } from "@react-navigation/native";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import SideMenu from "../../../components/navigation/SideMenu";
import CalendarComponent from "../../calendar/components/Calendar";
import DirectivesClosed from "../../directives/screens/DirectivesClosed";
import DirectivesCreateNew from "../../directives/screens/DirectivesCreateNew";
import DirectivesPending from "../../directives/screens/DirectivesPending";
import UserDirectives from "../../directives/screens/UserDirectives";
import MinutesRepoManagementScreen from "../../moms/Management/MinutesRepository";
import MinutesOfMeeting from "../../moms/User/MinutesOfMeeting";
import ManagementTwoYearPlanScreen from "../../twoYearPlan/screens/Management/TwoYearPlanScreen";
import UserTwoYearPlanScreen from "../../twoYearPlan/screens/User/TwoYearPlanScreen";
import DashboardHeader from "../components/DashboardHeader";
import {
  getDashboardHeaderTitle,
  getDashboardMenu,
} from "../config/dashboardMenu";
import DashboardHome from "./DashboardHome";


export default function DashboardScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const role = route?.params?.role ?? "management";
  const defaultSectionForRole = role === "user" ? "personal-calendar" : "dashboard";
  const roleLabel = role === "user" ? "Test User" : "Test Management";
  const headerTitle = getDashboardHeaderTitle(role);

  const [currentUserName, setCurrentUserName] = useState(roleLabel);
  const [pendingCount, setPendingCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);

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
        console.error("Error loading user in DashboardScreen:", err);
      }
    };
    loadUserName();
  }, []);

  const fetchDirectiveCounts = async () => {
    if (role === "user") return;
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}api/directive/threads`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const threads = await res.json();
        setPendingCount(threads.filter(t => t.status !== "closed").length);
        setClosedCount(threads.filter(t => t.status === "closed").length);
      }
    } catch (error) {
      console.error("Error fetching directive counts:", error);
    }
  };

  useEffect(() => {
    fetchDirectiveCounts();
  }, [role]);

  const menuItems = useMemo(() => {
    const rawMenu = getDashboardMenu(role);
    if (role !== "user") {
      return rawMenu.map(item => {
        if (item.id === "directives") {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.id === "directives-pending") {
                return { ...child, badge: pendingCount };
              }
              if (child.id === "directives-closed") {
                return { ...child, badge: closedCount };
              }
              return child;
            })
          };
        }
        return item;
      });
    }
    return rawMenu;
  }, [role, pendingCount, closedCount]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState(defaultSectionForRole);
  const [expandedParentIds, setExpandedParentIds] = useState({
    directives: true,
  });
  const [calendarResetKey, setCalendarResetKey] = useState(0);
  const [menuSafeAreaKey, setMenuSafeAreaKey] = useState(0);


  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (menuOpen) {
      fetchDirectiveCounts();
    }
  }, [menuOpen]);

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
    if (id === "personal-calendar" && activeItemId === "personal-calendar") {
      setCalendarResetKey(k => k + 1);
    }
    setActiveItemId(id);
    setMenuOpen(false);
  }

  return (
    <View className="flex-1 bg-[#F8F9FA]">
      <DashboardHeader
        roleLabel={roleLabel}
        navigation={navigation}
        headerTitle={headerTitle}
        onMenuPress={() => setMenuOpen(true)}
      />

      <View style={{ flex: 1, paddingHorizontal: 4, paddingBottom: Math.max(12, insets.bottom) }}>
        {activeItemId === "dashboard" && role === "management" ? (
          <DashboardHome />
        ) :
          activeItemId === "directives-closed" ? (
            <DirectivesClosed navigation={navigation} />
          ) :
            activeItemId === "directives-pending" ? (
              <DirectivesPending navigation={navigation} />
            ) :
              activeItemId === "directives-create" ? (
                <DirectivesCreateNew
                  navigation={navigation}
                  onSubmitted={() => setActiveItemId("directives-pending")}
                />
              ) :
                activeItemId === "directive" ? (
                  <UserDirectives />
                ) :
                  activeItemId === "two-year-plan" ? (
                    role === "user" ? (
                      <UserTwoYearPlanScreen navigation={navigation} embedded />
                    ) : (
                      <ManagementTwoYearPlanScreen navigation={navigation} />
                    )
                  )
                    :
                    activeItemId === "personal-calendar" ? (
                      <CalendarComponent resetViewTrigger={calendarResetKey} />
                    ) :
                      activeItemId === "minutes-repo" && role === "management" ? (
                        <MinutesRepoManagementScreen />
                      ) :
                        activeItemId === "minutes-of-meeting" && role === "user" ? (
                          <MinutesOfMeeting />
                        ) :
                          (
                            <View className="flex-1 justify-center px-4">
                              <Text className="text-center text-gray-600">{activeItemId}</Text>
                            </View>
                          )}
      </View>

      {menuOpen ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View className="flex-1 flex-row">
              <GestureDetector gesture={drawerPan}>
                <View
                  className="h-full w-[82%] max-w-[360px] overflow-hidden rounded-tr-[28px] rounded-br-[28px] bg-white shadow-2xl"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 6, height: 0 },
                    shadowOpacity: 0.16,
                    shadowRadius: 16,
                    elevation: 20,
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
                      navigation?.dispatch(
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