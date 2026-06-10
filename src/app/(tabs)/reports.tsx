import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";

import { Card } from "@/components/ui/Card";
import { COLORS } from "@/constants/colors";
import { useOrderStore } from "@/store/orderStore";
import { formatCurrency } from "@/utils/formatters";

function BarChart({
  title,
  subtitle,
  data,
  accent,
  compact = false,
}: {
  title: string;
  subtitle: string;
  data: { label: string; value: number }[];
  accent: string;
  compact?: boolean;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.chartSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.chartTotal}>{formatCurrency(data.reduce((sum, item) => sum + item.value, 0))}</Text>
      </View>
      <View style={[styles.chartArea, compact && styles.compactChartArea]}>
        {data.map((item, idx) => {
          const height = Math.max(18, Math.round((item.value / max) * (compact ? 88 : 120)));
          return (
            <View key={item.label + "_" + idx} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height, backgroundColor: accent }]} />
              </View>
              <Text style={styles.barLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string | number; tone?: "blue" | "green" | "orange" }) {
  const color = tone === "blue" ? COLORS.blue : tone === "green" ? COLORS.green : COLORS.primaryDark;

  return (
    <Card style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

export default function ReportsScreen() {
  const analytics = useOrderStore((state) => state.analytics);
  const fetchAnalytics = useOrderStore((state) => state.fetchAnalytics);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const sales = analytics.todaySales;
  const paid = analytics.paidCount;
  const active = analytics.activeCount;
  const averageTicket = analytics.averageTicket;
  const monthPace = analytics.monthPace;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <View style={styles.heroTitleRow}>
            <View>
              <Text style={styles.kicker}>MANAGER REPORT</Text>
              <Text style={styles.heroTitle}>Sales pulse</Text>
            </View>
          </View>
          <Text style={styles.heroSubtitle}>Weekly rhythm, monthly trend, and table velocity.</Text>
        </View>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeValue}>{formatCurrency(sales)}</Text>
          <Text style={styles.heroBadgeLabel}>today</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="Active orders" value={active} />
        <MetricCard label="Paid bills" value={paid} tone="green" />
        <MetricCard label="Avg ticket" value={formatCurrency(averageTicket)} tone="blue" />
        <MetricCard label="Month pace" value={formatCurrency(monthPace)} />
      </View>

      <BarChart
        title="Weekly sales"
        subtitle="Current service week"
        data={analytics.weeklySales}
        accent={COLORS.primary}
      />

      <BarChart
        title="Monthly sales"
        subtitle="6-month revenue trend"
        data={analytics.monthlySales}
        accent={COLORS.blue}
        compact
      />

      <Card style={styles.insightCard}>
        <Text style={styles.insightKicker}>Shift insight</Text>
        <Text style={styles.insightTitle}>Dinner rush is carrying the week.</Text>
        <Text style={styles.insightText}>
          Keep track of your active tables and speed up billing cycle times. Focus on fast-moving beverages and specials to increase average ticket values.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.bg,
    flex: 1,
  },
  content: {
    gap: 14,
    padding: 18,
    paddingBottom: 34,
  },
  hero: {
    backgroundColor: COLORS.espresso,
    borderCurve: "continuous",
    borderRadius: 28,
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: 22,
  },
  heroText: {
    flex: 1,
    flexShrink: 1,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
    marginBottom: 4,
  },
  kicker: {
    color: "#FDBA74",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  heroSubtitle: {
    color: "#D7CEC4",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
    maxWidth: 240,
  },
  heroBadge: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
    borderCurve: "continuous",
    borderRadius: 20,
    flexShrink: 0,
    minWidth: 88,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  heroBadgeValue: {
    color: COLORS.white,
    fontSize: 19,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
  heroBadgeLabel: {
    color: "#FFEAD9",
    fontSize: 11,
    fontWeight: "900",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metric: {
    flex: 1,
    flexBasis: "45%",
    gap: 5,
    minHeight: 88,
    minWidth: 120,
    padding: 13,
  },
  metricValue: {
    fontSize: 21,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
  metricLabel: {
    color: COLORS.textSec,
    fontSize: 11,
    fontWeight: "800",
  },
  chartCard: {
    gap: 16,
    padding: 16,
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
  chartArea: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 9,
    height: 154,
  },
  compactChartArea: {
    height: 122,
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  barTrack: {
    alignItems: "center",
    backgroundColor: COLORS.panel,
    borderColor: COLORS.border,
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: "flex-end",
    overflow: "hidden",
    width: "100%",
  },
  bar: {
    borderCurve: "continuous",
    borderRadius: 999,
    width: "100%",
  },
  barLabel: {
    color: COLORS.textSec,
    fontSize: 10,
    fontWeight: "900",
  },
  insightCard: {
    backgroundColor: COLORS.espresso,
    gap: 6,
    padding: 18,
  },
  insightKicker: {
    color: "#FDBA74",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  insightTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "900",
  },
  insightText: {
    color: "#D7CEC4",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
});

