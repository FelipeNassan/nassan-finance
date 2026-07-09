import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";

interface OnboardingLoaderProps {
  userName: string;
  onComplete: () => void;
}

const { height } = Dimensions.get("window");

export function OnboardingLoader({ userName, onComplete }: OnboardingLoaderProps) {
  const insets = useSafeAreaInsets();

  // Progress bar width
  const progress = useSharedValue(0);

  // Text 1: "Preparando a sua experiência"
  const text1Opacity = useSharedValue(0);
  const text1Y = useSharedValue(12); // slide up from slightly below
  const text1Scale = useSharedValue(1);
  const text1ColorProgress = useSharedValue(0); // 0 -> primary, 1 -> secondary

  // Text 2: "Buscando os seus dados"
  const text2Opacity = useSharedValue(0);
  const text2Y = useSharedValue(12);
  const text2Scale = useSharedValue(1);
  const text2ColorProgress = useSharedValue(0);

  // Text 3: "Olá, [Name]"
  const text3Opacity = useSharedValue(0);
  const text3Y = useSharedValue(12);
  const text3Scale = useSharedValue(1);

  // Background and progress bar fade out at the end
  const bgOpacity = useSharedValue(1);
  const bgColorProgress = useSharedValue(0);
  const barOpacity = useSharedValue(1);

  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  const [isTypingPhase, setIsTypingPhase] = useState(false);

  const fullText = `Olá, ${userName}!`;

  // Typing effect
  useEffect(() => {
    if (isTypingPhase) {
      let i = 0;
      const interval = setInterval(() => {
        if (i < fullText.length) {
          setTypedText(fullText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          // Blink cursor a bit, then move on
          let blinks = 0;
           
          const blinkInterval = setInterval(() => {
            setCursorVisible((v) => !v);
            blinks++;
            if (blinks > 3) {
              clearInterval(blinkInterval);
              setCursorVisible(false);
              // Trigger final transition
              startFinalTransition();
            }
          }, 200);
        }
      }, 120); // slower typing

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTypingPhase, fullText]);

  const startFinalTransition = () => {
    // 1. Progress to 100%
    progress.value = withTiming(100, { duration: 300 });

    // 2. Fade out background and progress bar
    bgOpacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });

    // 3. Move Text 3 (Olá) up
    // Approximately 200px up or similar to get it out of the center.
    text3Y.value = withSpring(-height / 2 + insets.top + spacing.md + 20, {
      damping: 20,
      stiffness: 90,
    });
    
    // Reduzir ligeiramente o tamanho da fonte e diminuir o peso visual (opacidade)
    text3Scale.value = withTiming(0.85, { duration: 500, easing: Easing.out(Easing.ease) });
    text3Opacity.value = withTiming(0.7, { duration: 500, easing: Easing.out(Easing.ease) });
    
    // Tell parent to start stagger of Home cards
    setTimeout(() => {
      onComplete();
    }, 150); // Trigger slightly before the fade finishes
  };

  useEffect(() => {
    // Sequence
    const startSequence = () => {
      // Stage 1
      progress.value = withTiming(50, { duration: 800, easing: Easing.out(Easing.cubic) });
      text1Opacity.value = withTiming(1, { duration: 500 });
      text1Y.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.back(1.5)) });

      // Wait 2.0s -> Stage 2
      setTimeout(() => {
        progress.value = withTiming(100, { duration: 800, easing: Easing.out(Easing.cubic) });
        
        // Text 1 goes up (more distance to avoid overlap) and gray
        text1Y.value = withTiming(-80, { duration: 500, easing: Easing.out(Easing.cubic) });
        text1Scale.value = withTiming(0.85, { duration: 500 });
        text1ColorProgress.value = withTiming(1, { duration: 500 }); // Turn gray
        
        // Text 2 fades in, positioned below text 1
        text2Opacity.value = withTiming(1, { duration: 500 });
        text2Y.value = withTiming(20, { duration: 500, easing: Easing.out(Easing.back(1.5)) });

        // Wait 2.0s -> END texts and transition background
        setTimeout(() => {
          // Both texts and progress bar fade out
          text1Opacity.value = withTiming(0, { duration: 400 });
          text2Opacity.value = withTiming(0, { duration: 400 });
          barOpacity.value = withTiming(0, { duration: 400 });
          
          // Background transitions to #685022 over 2 seconds
          bgColorProgress.value = withTiming(1, { duration: 2000 });
          
          // Wait 1.0s sem texto -> Stage 3 (Typing)
          setTimeout(() => {
            text3Opacity.value = withTiming(1, { duration: 300 });
            text3Y.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
            setIsTypingPhase(true);
            setCursorVisible(true);
          }, 1000);
        }, 2000);
      }, 2000);
    };

    startSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animated styles
  const text1Style = useAnimatedStyle(() => ({
    opacity: text1Opacity.value,
    transform: [
      { translateY: text1Y.value },
      { scale: text1Scale.value }
    ],
  }));

  const text2Style = useAnimatedStyle(() => ({
    opacity: text2Opacity.value,
    transform: [
      { translateY: text2Y.value },
      { scale: text2Scale.value }
    ],
  }));

  const text3Style = useAnimatedStyle(() => ({
    opacity: text3Opacity.value,
    transform: [
      { translateY: text3Y.value },
      { scale: text3Scale.value }
    ],
  }));

  // Reanimated style for color interpolation
  const text1ColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      text1ColorProgress.value,
      [0, 1],
      [colors.primary, colors.secondary]
    ) as string,
  }));

  const text2ColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      text2ColorProgress.value,
      [0, 1],
      [colors.primary, colors.secondary]
    ) as string,
  }));

  const text3ColorStyle = useAnimatedStyle(() => ({
    // When background is #685022, text should be white to be visible
    color: interpolateColor(
      bgColorProgress.value,
      [0, 1],
      [colors.primary, colors.onPrimary]
    ) as string,
  }));

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      bgColorProgress.value,
      [0, 1],
      [colors.background, "#685022"]
    ) as string,
    opacity: bgOpacity.value,
    // When opacity hits 0, display none to allow touches below
    display: bgOpacity.value <= 0.01 ? "none" : "flex",
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
    opacity: barOpacity.value, // fade out before typing
  }));

  const progressContainerStyle = useAnimatedStyle(() => ({
    opacity: barOpacity.value, // hide the container's background too
  }));

  return (
    <Animated.View style={[styles.container, bgStyle]}>
      <View style={styles.centerContainer}>
        {/* Text 1 */}
        <Animated.View style={[styles.textWrapper, text1Style]}>
          <Animated.Text 
            style={[
              { fontFamily: "Caslon", fontSize: 24, lineHeight: 30, textAlign: "left" },
              text1ColorStyle
            ]}
          >
            Preparando a sua experiência
          </Animated.Text>
        </Animated.View>

        {/* Text 2 */}
        <Animated.View style={[styles.textWrapper, text2Style]}>
          <Animated.Text 
            style={[
              { fontFamily: "Caslon", fontSize: 24, lineHeight: 30, textAlign: "left" },
              text2ColorStyle
            ]}
          >
            Buscando os seus dados
          </Animated.Text>
        </Animated.View>

        {/* Text 3 (Typing) */}
        <Animated.View style={[styles.textWrapper, text3Style]}>
          <Animated.Text 
            style={[
              { fontFamily: "Caslon", fontSize: 24, lineHeight: 30, textAlign: "left" },
              text3ColorStyle
            ]}
          >
            {typedText}
            {cursorVisible ? "|" : ""}
          </Animated.Text>
        </Animated.View>
      </View>

      {/* Progress Bar */}
      <Animated.View style={[styles.progressContainer, { bottom: insets.bottom + 40 }, progressContainerStyle]}>
        <Animated.View style={[styles.progressFill, progressBarStyle]} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    height: 120, // fixed height container to position texts absolutely inside
    justifyContent: "center",
    alignItems: "flex-start",
    width: "100%",
    paddingHorizontal: spacing.xl,
  },
  textWrapper: {
    position: "absolute",
    width: "100%",
    alignItems: "flex-start",
    paddingHorizontal: spacing.xl,
  },
  progressContainer: {
    position: "absolute",
    width: "60%",
    height: 6,
    backgroundColor: "rgba(117,90,38,0.1)", // colors.primary 10%
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
});
