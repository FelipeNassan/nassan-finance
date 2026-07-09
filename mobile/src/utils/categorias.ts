import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

type Icone = ComponentProps<typeof Ionicons>["name"];

// Ionicons por categoria padrão (multiplataforma); genérico para categorias do usuário
const ICONES: Record<string, Icone> = {
  Alimentação: "restaurant",
  Assinaturas: "repeat",
  Delivery: "bag-handle",
  Educação: "school",
  Imposto: "business",
  Lazer: "umbrella",
  Moradia: "home",
  Outros: "grid",
  Saúde: "heart",
  Transporte: "car",
};

export function iconeDaCategoria(nome: string): Icone {
  return ICONES[nome] ?? "pricetag";
}
