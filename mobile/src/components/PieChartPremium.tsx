import React from "react";
import { View } from "react-native";
import Svg, { G, Path, Line, Text as SvgText } from "react-native-svg";

export interface PieChartData {
  key: string;
  value: number;
  color: string;
  label: string;
}

interface Props {
  data: PieChartData[];
  width: number;
  height: number;
}

export function PieChartPremium({ data, width, height }: Props) {
  // Aumentado o raio para dar mais destaque ao gráfico
  const radius = Math.min(width, height) / 2 * 0.70;
  const outerRadius = radius * 1.15;
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

  let currentAngle = -Math.PI / 2; // Start from top (12 o'clock)

  const arcs = data.map((d) => {
    const angle = (d.value / total) * Math.PI * 2;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      data: d,
      startAngle,
      endAngle,
      midAngle: startAngle + angle / 2,
    };
  });

  const getCoordinates = (angle: number, r: number) => ({
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
  });

  const getArcPath = (startAngle: number, endAngle: number, r: number) => {
    const start = getCoordinates(startAngle, r);
    const end = getCoordinates(endAngle, r);
    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
    // M 0 0: start at center for a pie slice
    // L start.x start.y: line to the edge
    // A r r 0 largeArcFlag 1 end.x end.y: draw arc
    // Z: close path
    return `M 0 0 L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  return (
    <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
      <Svg width={width} height={height}>
        <G x={width / 2} y={height / 2}>
          {arcs.map((arc) => {
            const arcPath = getArcPath(arc.startAngle, arc.endAngle, radius);
            const centroid = getCoordinates(arc.midAngle, radius * 0.75);
            const outerCentroid = getCoordinates(arc.midAngle, outerRadius);
            
            const isRight = Math.cos(arc.midAngle) > 0;
            const horizontalLineLength = 50;
            const endX = outerCentroid.x + (isRight ? horizontalLineLength : -horizontalLineLength);
            const midX = outerCentroid.x + (isRight ? horizontalLineLength / 2 : -horizontalLineLength / 2);

            const percent = ((arc.data.value / total) * 100).toFixed(0) + "%";
            // Simplificando nomes grandes para não poluir o gráfico
            const shortLabel = arc.data.label.replace("Cartão de ", "");

            return (
              <G key={arc.data.key}>
                {/* Fatia da Pizza */}
                <Path d={arcPath} fill={arc.data.color} />

                {/* Linha diagonal saindo do centro da fatia */}
                <Line
                  x1={centroid.x}
                  y1={centroid.y}
                  x2={outerCentroid.x}
                  y2={outerCentroid.y}
                  stroke={arc.data.color}
                  strokeWidth={1.5}
                  opacity={0.7}
                />
                
                {/* Linha horizontal sustentando as legendas */}
                <Line
                  x1={outerCentroid.x}
                  y1={outerCentroid.y}
                  x2={endX}
                  y2={outerCentroid.y}
                  stroke={arc.data.color}
                  strokeWidth={1.5}
                  opacity={0.7}
                />

                {/* Nome da legenda (acima da linha) */}
                <SvgText
                  x={midX}
                  y={outerCentroid.y - 6}
                  fill={"#8E8E93"}
                  fontSize="11"
                  textAnchor="middle"
                >
                  {shortLabel}
                </SvgText>

                {/* Texto da porcentagem (abaixo da linha) */}
                <SvgText
                  x={midX}
                  y={outerCentroid.y + 14}
                  fill={arc.data.color}
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {percent}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
