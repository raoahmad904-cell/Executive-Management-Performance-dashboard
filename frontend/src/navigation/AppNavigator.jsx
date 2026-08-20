import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import AllUsersScreen from "../features/auth/screens/AllUsersScreen";
import ChangePasswordScreen from "../features/auth/screens/ChangePasswordScreen";
import LoginScreen from "../features/auth/screens/LoginScreen";
import RegisterScreen from "../features/auth/screens/RegisterScreen";
import SplashScreen from "../features/auth/screens/SplashScreen";
import DashboardScreen from "../features/dashboard/screens/DashboardScreen";
import DirectiveHistory from "../features/directives/screens/DirectiveHistory";
import DirectiveView from "../features/directives/screens/DirectiveView";
import TwoYearPlanMemberDetails from "../features/twoYearPlan/screens/Management/TwoYearPlanMemberDetails";
import UserTwoYearPlanScreen from "../features/twoYearPlan/screens/User/TwoYearPlanScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="AllUsers" component={AllUsersScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen
        name="TwoYearPlanMemberDetails"
        component={TwoYearPlanMemberDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserTwoYearPlan"
        component={UserTwoYearPlanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DirectiveView"
        component={DirectiveView}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DirectiveHistory"
        component={DirectiveHistory}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}