import * as ScreenOrientation from "expo-screen-orientation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Fullscreen body: subscribes to window size after rotation so chart gets real landscape dims.
 * renderChart(width, height, { expanded: true })
 */
function FullscreenModalBody({ title, onClose, renderChart }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const padX = 24;
  const headerBlock = 52;
  const chartW = Math.max(1, width - padX * 2);
  const chartH = Math.max(
    1,
    height - insets.top - insets.bottom - headerBlock - padX
  );

  return (
    <View
      className="flex-1 bg-[#1a1a2e] px-6"
      style={{
        paddingTop: Math.max(insets.top, padX),
        paddingBottom: insets.bottom,
      }}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="flex-1 pr-2 text-lg font-semibold text-white">
          {title}
        </Text>
        <Pressable
          onPress={onClose}
          className="rounded-lg bg-white/15 px-4 py-2"
        >
          <Text className="text-sm font-semibold text-white">✕ Close</Text>
        </Pressable>
      </View>
      <View className="min-h-[120px] flex-1 justify-center overflow-hidden">
        {renderChart(chartW, chartH, { expanded: true })}
      </View>
    </View>
  );
}

/**
 * Inline preview + fullscreen modal with landscape lock (native only).
 * renderChart(width, height, options?)
 * options.expanded === true in fullscreen modal only.
 */
export default function FullscreenLandscapeCard({ title, renderChart }) {
  const { width } = useWindowDimensions();
  const [fullscreen, setFullscreen] = useState(false);
  const openedFullscreen = useRef(false);
  const [chartSlotWidth, setChartSlotWidth] = useState(0);

  const previewH = 280;
  const fallbackPreviewW = Math.max(48, width - 80);
  const previewW =
    chartSlotWidth > 0 ? chartSlotWidth : fallbackPreviewW;

  const restorePortrait = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    } catch {
      await ScreenOrientation.unlockAsync();
    }
  }, []);

  const lockLandscape = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
      );
    } catch {
      /* ignore */
    }
  }, []);

  const openFullscreen = useCallback(() => {
    openedFullscreen.current = true;
    StatusBar.setHidden(true);
    setFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(async () => {
    openedFullscreen.current = false;
    StatusBar.setHidden(false);
    setFullscreen(false);
    await restorePortrait();
  }, [restorePortrait]);

  useEffect(() => {
    if (Platform.OS === "web" || !fullscreen) return undefined;

    const task = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        lockLandscape();
      });
    });

    return () => task.cancel?.();
  }, [fullscreen, lockLandscape]);

  useEffect(() => {
    return () => {
      if (openedFullscreen.current) {
        StatusBar.setHidden(false);
        restorePortrait();
      }
    };
  }, [restorePortrait]);

  const modalPresentation =
    Platform.OS === "ios" ? "fullScreen" : "overFullScreen";

  return (
    <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="flex-1 pr-2 text-base font-bold text-gray-900">
          {title}
        </Text>
        <Pressable
          onPress={openFullscreen}
          className="rounded-lg bg-[#EBF5FF] px-3 py-2"
        >
          <Text className="text-xs font-semibold text-[#1A6FBF]">
            ⛶ Expand
          </Text>
        </Pressable>
      </View>

      <View
        className="overflow-hidden rounded-xl"
        onLayout={(e) => {
          const w = Math.floor(e.nativeEvent.layout.width);
          if (w > 0 && w !== chartSlotWidth) setChartSlotWidth(w);
        }}
      >
        {renderChart(previewW, previewH, { expanded: false })}
      </View>

      <Modal
        visible={fullscreen}
        animationType="fade"
        transparent={false}
        presentationStyle={modalPresentation}
        statusBarTranslucent={Platform.OS === "android"}
        supportedOrientations={
          Platform.OS === "ios"
            ? [
                "portrait",
                "portrait-upside-down",
                "landscape",
                "landscape-left",
                "landscape-right",
              ]
            : undefined
        }
        onRequestClose={closeFullscreen}
      >
        <FullscreenModalBody
          title={title}
          onClose={closeFullscreen}
          renderChart={renderChart}
        />
      </Modal>
    </View>
  );
}