import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/constants/colors";

interface QtyControlProps {
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function QtyControl({ qty, onIncrement, onDecrement }: QtyControlProps) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onDecrement} style={styles.minusButton}>
        <Text style={styles.minusButtonText}>-</Text>
      </Pressable>
      <Text style={styles.qty}>{qty}</Text>
      <Pressable onPress={onIncrement} style={styles.plusButton}>
        <Text style={styles.plusButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  minusButton: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  minusButtonText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 22,
  },
  plusButton: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  plusButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 22,
  },
  qty: {
    color: COLORS.text,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    minWidth: 16,
    textAlign: "center",
  },
});
