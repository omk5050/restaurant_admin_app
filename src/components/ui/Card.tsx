import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle, Platform } from "react-native";

import { COLORS } from "@/constants/colors";

interface CardProps extends PropsWithChildren {
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#231B13",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.07,
        shadowRadius: 22,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 8px 22px rgba(35, 27, 19, 0.07)",
      },
    }),
  },
});
