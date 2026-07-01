import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { COLORS } from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";

interface PieChartProps {
  title: string;
  subtitle: string;
  data: { label: string; value: number }[];
}

export function PieChart({ title, subtitle, data }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Colors mapping for segments
  const colorsMap: Record<string, string> = {
    Cash: COLORS.green,
    UPI: COLORS.primary,
    Card: COLORS.blue,
  };

  const defaultColors = [COLORS.green, COLORS.primary, COLORS.blue];

  // Pre-calculate percentages and cumulative offsets purely to satisfy React Compiler constraints
  const processedData = data.map((item, index) => {
    const pct = total > 0 ? item.value / total : 0;
    
    // Sum the percentages of all elements prior to the current index
    const offset = data.slice(0, index).reduce((sum, prevItem) => {
      const prevPct = total > 0 ? prevItem.value / total : 0;
      return sum + prevPct;
    }, 0);

    return {
      ...item,
      percentage: pct,
      offset,
      color: colorsMap[item.label] || defaultColors[index % defaultColors.length],
    };
  });

  // SVG parameters
  const R = 36;
  const C = 2 * Math.PI * R; // ~226.195

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.chartSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.chartTotal}>{formatCurrency(total)}</Text>
      </View>

      <View style={styles.chartContent}>
        {/* SVG Donut Chart */}
        <View style={styles.svgWrapper}>
          <svg width="140" height="140" viewBox="0 0 100 100">
            <g transform="rotate(-90 50 50)">
              {/* Fallback circle if total is 0 */}
              {total === 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  stroke={COLORS.border}
                  strokeWidth="12"
                  fill="transparent"
                />
              )}
              {processedData.map((item, idx) => {
                if (item.value === 0) return null;
                const strokeDasharray = `${item.percentage * C} ${C}`;
                const strokeDashoffset = -item.offset * C;

                return (
                  <circle
                    key={item.label + "_" + idx}
                    cx="50"
                    cy="50"
                    r={R}
                    stroke={item.color}
                    strokeWidth="12"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    fill="transparent"
                    style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
                  />
                );
              })}
            </g>
            {/* Center Text */}
            <text
              x="50"
              y="48"
              textAnchor="middle"
              style={{
                fontSize: "8px",
                fontWeight: "900",
                fill: COLORS.text,
                fontFamily: "sans-serif",
              }}
            >
              {formatCurrency(total)}
            </text>
            <text
              x="50"
              y="60"
              textAnchor="middle"
              style={{
                fontSize: "5px",
                fontWeight: "700",
                fill: COLORS.textSec,
                fontFamily: "sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Total Paid
            </text>
          </svg>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          {processedData.map((item, idx) => {
            const pctText = `${Math.round(item.percentage * 100)}%`;
            return (
              <View key={item.label + "_" + idx} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <View style={styles.legendTextContainer}>
                  <Text style={styles.legendLabel}>{item.label}</Text>
                  <Text style={styles.legendValue}>
                    {formatCurrency(item.value)} <Text style={styles.legendPct}>({pctText})</Text>
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    gap: 16,
    padding: 16,
    height: "100%",
  },
  chartHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  chartTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
  },
  chartSubtitle: {
    color: COLORS.textSec,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  chartTotal: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
  chartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    gap: 16,
    flex: 1,
  },
  svgWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  legendContainer: {
    flex: 1,
    gap: 10,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendTextContainer: {
    flexDirection: "column",
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
  },
  legendValue: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSec,
    marginTop: 1,
  },
  legendPct: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textSec,
  },
});
