import { StyleSheet, View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "@/theme";

// Fundo dourado com formas orgânicas translúcidas — identidade visual do fortn
// nas telas de autenticação. Ocupa toda a área do pai.
export function BrandBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.base} />
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <Path
          d="M-40,180 C60,120 140,240 240,180 C320,132 380,180 440,150 L440,-40 L-40,-40 Z"
          fill="#ffffff"
          opacity={0.07}
        />
        <Path
          d="M-40,420 C80,360 160,480 280,420 C360,380 420,430 460,410 L460,700 L-40,700 Z"
          fill="#ffffff"
          opacity={0.05}
        />
        <Circle cx="330" cy="120" r="70" fill="#ffffff" opacity={0.06} />
        <Circle cx="70" cy="520" r="90" fill="#ffffff" opacity={0.05} />
        <Circle cx="300" cy="470" r="40" fill="#ffffff" opacity={0.07} />
        <Circle cx="150" cy="300" r="24" fill="#ffffff" opacity={0.08} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.primary },
});
