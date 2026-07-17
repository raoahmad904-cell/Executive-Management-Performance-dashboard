import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import {
    initialWindowMetrics,
    SafeAreaProvider,
} from "react-native-safe-area-context";
import "./global.css";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}