import { Platform } from "react-native";

// A intro (digitação do "Olá, ...") toca só quando o app abre de verdade:
// - Nativo: variável de módulo — vive enquanto o app está aberto e zera ao fechar.
// - Web: sessionStorage — sobrevive ao F5 e zera ao fechar a aba.
const CHAVE = "fortn.introExibida";
let exibidaNativo = false;

export function introJaFoiExibida(): boolean {
  if (Platform.OS === "web") {
    try {
      return sessionStorage.getItem(CHAVE) === "1";
    } catch {
      return false;
    }
  }
  return exibidaNativo;
}

export function marcarIntroExibida() {
  if (Platform.OS === "web") {
    try {
      sessionStorage.setItem(CHAVE, "1");
    } catch {
      /* storage indisponível: sem persistência */
    }
    return;
  }
  exibidaNativo = true;
}
