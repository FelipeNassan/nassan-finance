import { useEffect, useRef, useState } from "react";
import { Text } from "./Text";
import { colors } from "@/theme";
import { formatarBRL } from "@/utils/format";
import { useVisibility } from "@/store/visibility";

interface Props {
  value: number;
  moeda?: boolean;
  variant?: React.ComponentProps<typeof Text>["variant"];
  color?: string;
  duration?: number;
}

// Contador que sobe com ease-out. RAF em JS: idêntico em iOS, Android e Web.
export function AnimatedNumber({
  value,
  moeda = true,
  variant = "displayXl",
  color = colors.onSurface,
  duration = 800,
}: Props) {
  const [exibido, setExibido] = useState(0);
  const frame = useRef<number>(0);
  const de = useRef(0);

  useEffect(() => {
    const inicio = Date.now();
    const origem = de.current;
    const delta = value - origem;

    const tick = () => {
      const t = Math.min((Date.now() - inicio) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const atual = origem + delta * eased;
      setExibido(atual);
      if (t < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        de.current = value;
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, duration]);

  const { isVisible } = useVisibility();

  const texto = !isVisible
    ? "••••"
    : moeda
      ? formatarBRL(exibido)
      : Math.round(exibido).toLocaleString("pt-BR");

  return (
    <Text variant={variant} color={color}>
      {texto}
    </Text>
  );
}
