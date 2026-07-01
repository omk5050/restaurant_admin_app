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

  const colorsMap: Record<string, string> = {
    Cash: COLORS.green,
    UPI: COLORS.primary,
    Card: COLORS.blue,
  };

  const defaultColors = [COLORS.green, COLORS.primary, COLORS.blue];

  const processedData = data.map((item, index) => {
    const pct = total > 0 ? item.value / total : 0;
    return {
      ...item,
      percentage: pct,
      color: colorsMap[item.label] || defaultColors[index % defaultColors.length],
    };
  });

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
        {/* Horizontal Stacked Bar */}
        <View style={styles.barContainer}>
          {total === 0 ? (
            <View style={[styles.barSegment, { flex: 1, backgroundColor: COLORS.border }]} />
          ) : (
            processedData.map((item, idx) => {
              if (item.value === 0) return null;
              return (
                <View
                  key={item.label + "_" + idx}
                  style={[
                    styles.barSegment,
                    {
                      flex: item.value,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              );
            })
          )}
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          {processedData.map((item, idx) => {
            const pctText = `${Math.round(item.percentage * 100)}%`;
            return (
              <View key={item.label + "_" + idx} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}:</Text>
                <Text style={styles.legendValue}>
                  {formatCurrency(item.value)} <Text style={styles.legendPct}>({pctText})</Text>
                </Text>
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
    gap: 16,
    flex: 1,
    justifyContent: "center",
  },
  barContainer: {
    height: 24,
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: COLORS.grayLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  barSegment: {
    height: "100%",
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  },
  legendPct: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textSec,
  },
});
