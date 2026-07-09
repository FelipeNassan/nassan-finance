import { StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/theme";

// Mancha orgânica decorativa no canto do card (detalhe herdado do design original).
// Fica atrás do conteúdo, bem sutil. O card precisa de overflow:"hidden" para recortá-la.
//
// O path é centrado na origem (coords ~ -92..92). Em vez de usar transform="translate(...)"
// — que o react-native-svg NÃO aplica no nativo (só na web) — centramos o próprio viewBox
// na origem. Assim renderiza igual em iOS, Android e Web.
export function CardBlob() {
  return (
    <Svg viewBox="-100 -100 200 200" style={styles.blob} pointerEvents="none">
      <Path
        d="M44.7,-76.4C58.3,-69.2,70,-58.5,77.4,-45.5C84.7,-32.5,87.8,-17.2,85.6,-2.8C83.5,11.6,76.1,25.1,67.6,37.3C59.1,49.5,49.5,60.4,37.6,68.7C25.7,77,11.5,82.7,-2.8,87.6C-17.1,92.5,-31.5,96.6,-44.7,91.8C-57.9,87,-69.9,73.3,-78.4,58.8C-86.9,44.3,-91.9,29,-92.4,14C-92.9,-1,-88.9,-15.7,-81.4,-28.9C-73.9,-42.1,-62.9,-53.8,-50,-61.5C-37.1,-69.2,-22.3,-72.9,-7.1,-60.7C8.1,-48.5,22.3,-60.7,44.7,-76.4Z"
        fill={colors.primary}
        opacity={0.06}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    right: -55,
    bottom: -55,
    width: 210,
    height: 210,
  },
});
