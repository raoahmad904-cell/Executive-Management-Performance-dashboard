import React, { useEffect, useRef } from "react";
import { Dimensions, Image, StatusBar, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function SplashScreen({ navigation }) {
  const bgOpacity          = useSharedValue(0);
  const logoScale          = useSharedValue(0.3);
  const logoOpacity        = useSharedValue(0);
  const titleOpacity       = useSharedValue(0);
  const titleTranslateY    = useSharedValue(30);
  const dividerWidth       = useSharedValue(0);
  const subtitleOpacity    = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  const taglineOpacity     = useSharedValue(0);
  const dotsOpacity        = useSharedValue(0);

  const timerRef = useRef(null);

  useEffect(() => {
    // Background
    bgOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });

    // Logo bounce in
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    logoScale.value = withDelay(
      300,
      withSequence(
        withTiming(1.1, { duration: 600, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1.0, { duration: 200, easing: Easing.inOut(Easing.ease) })
      )
    );

    // Title
    titleOpacity.value    = withDelay(900, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(900, withTiming(0, { duration: 500, easing: Easing.out(Easing.back(1.2)) }));

    // Divider
    dividerWidth.value = withDelay(1300, withTiming(200, { duration: 400 }));

    // Subtitle
    subtitleOpacity.value    = withDelay(1500, withTiming(1, { duration: 500 }));
    subtitleTranslateY.value = withDelay(1500, withTiming(0, { duration: 500, easing: Easing.out(Easing.back(1.1)) }));

    // Tagline
    taglineOpacity.value = withDelay(2000, withTiming(1, { duration: 500 }));

    // Dots
    dotsOpacity.value = withDelay(2400, withTiming(1, { duration: 400 }));

    // Navigate to Login after animation
    timerRef.current = setTimeout(() => {
      navigation.replace("Login");
    }, 3600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const bgStyle       = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const logoStyle     = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));
  const titleStyle    = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: titleTranslateY.value }] }));
  const dividerStyle  = useAnimatedStyle(() => ({ width: dividerWidth.value }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value, transform: [{ translateY: subtitleTranslateY.value }] }));
  const taglineStyle  = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const dotsStyle     = useAnimatedStyle(() => ({ opacity: dotsOpacity.value }));

  return (
    <View className="flex-1 bg-[#0a5c36] items-center justify-center">
      <StatusBar barStyle="light-content" backgroundColor="#0a5c36" />

      {/* Decorative background layer */}
      <Animated.View
        className="bg-[#0a5c36] overflow-hidden"
        style={[{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }, bgStyle]}
      >
        <View className="absolute w-[300px] h-[300px] rounded-full bg-white/5 -top-20 -right-20" />
        <View className="absolute w-[400px] h-[400px] rounded-full bg-white/[0.04] -bottom-[120px] -left-[120px]" />
        <View
          className="absolute h-0.5 bg-white/[0.06] -rotate-[8deg]"
          style={{ width: width * 1.5, top: height * 0.55, left: -width * 0.25 }}
        />
      </Animated.View>

      {/* Main content */}
      <View className="items-center px-8">

        {/* Logo */}
        <Animated.View className="mb-7" style={logoStyle}>
          <View
            className="w-[120px] h-[120px] rounded-full bg-white items-center justify-center border-[3px] border-white/40"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12 }}
          >
            <Image
              source={require("../../../assets/images/login_logo.jpeg")}
              className="w-[90px] h-[90px] rounded-full"
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          className="text-[26px] font-extrabold text-white tracking-wide text-center mb-3.5"
          style={titleStyle}
        >
          Performance Dashboard
        </Animated.Text>

        {/* Divider */}
        <Animated.View
          className="h-0.5 bg-white/50 rounded-sm mb-4"
          style={dividerStyle}
        />

        {/* Ministry name */}
        <Animated.View className="items-center mb-5" style={subtitleStyle}>
          <Text className="text-[15px] text-white/85 font-medium tracking-wide text-center leading-[22px]">
            Ministry of Planning,
          </Text>
          <Text className="text-[15px] text-white/85 font-medium tracking-wide text-center leading-[22px]">
            Development &amp;
          </Text>
          <Text className="text-[15px] text-white/85 font-medium tracking-wide text-center leading-[22px]">
            Special Initiatives
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text
          className="text-xs text-white/55 italic tracking-wide text-center mt-1"
          style={taglineStyle}
        >
          Empowering Decisions. Driving Progress.
        </Animated.Text>
      </View>

      {/* Footer */}
      <Animated.View className="absolute bottom-12 items-center" style={dotsStyle}>
        <LoadingDots />
        <Text className="text-[11px] text-white/40 tracking-widest uppercase">
          Government of Pakistan
        </Text>
      </Animated.View>
    </View>
  );
}

function LoadingDots() {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  const t1Ref      = useRef(null);
  const t2Ref      = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const animate = () => {
      dot1.value = withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      );
      t1Ref.current = setTimeout(() => {
        dot2.value = withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        );
      }, 200);
      t2Ref.current = setTimeout(() => {
        dot3.value = withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        );
      }, 400);
    };

    animate();
    intervalRef.current = setInterval(animate, 1200);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(t1Ref.current);
      clearTimeout(t2Ref.current);
    };
  }, []);

  const d1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const d2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const d3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View className="flex-row mb-2.5">
      <Animated.View className="w-[7px] h-[7px] rounded-full bg-white/70 mx-[3px]" style={d1} />
      <Animated.View className="w-[7px] h-[7px] rounded-full bg-white/70 mx-[3px]" style={d2} />
      <Animated.View className="w-[7px] h-[7px] rounded-full bg-white/70 mx-[3px]" style={d3} />
    </View>
  );
}