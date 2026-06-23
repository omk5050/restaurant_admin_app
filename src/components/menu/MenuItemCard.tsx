import { QtyControl } from "@/components/ui/QtyControl";
import { COLORS } from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import { MenuItem } from "@/types";
import { StyleSheet, Text, View, Image } from "react-native";

const menuImages: Record<string, number> = {
  // ── Existing items ──────────────────────────────────────────────────────────
  "Veg Dum Biryani":        require("../../../assets/images/Veg-Dum-Biryani.jpg"),
  "Egg Dum Biryani":        require("../../../assets/images/egg-dum-biryani.jpg"),
  "French Fries Classic":   require("../../../assets/images/french-fries-classic.jpg"),
  "Peri Peri French Fries": require("../../../assets/images/peri-peri-fries.jpg"),
  "Tripple Choco Bowl":     require("../../../assets/images/triple-choco-bowl.jpg"),
  "Oreo Choco Bowl":        require("../../../assets/images/oreo-choco-bowl.jpg"),
  "Paneer Tikka Biryani":   require("../../../assets/images/Paneer-Tikka-Biryani.jpg"),
  "Paneer Kalimiri Kabab":  require("../../../assets/images/paneer-kalimiri-kabab.jpg"),

  // ── New items ───────────────────────────────────────────────────────────────
  "Chicken Dum Biryani":    require("../../../assets/images/Chicken-Dum-Biryani.jpg"),
  "Mutton Dum Biryani":     require("../../../assets/images/Mutton-Dum-Biryani.jpg"),
  "Chicken Tikka Biryani":  require("../../../assets/images/chicken-Tikka-Biryani.jpg"),
  "Tandoori Biryani":       require("../../../assets/images/Tandoori-Biryani.jpg"),
  "Afghani Tandoor":        require("../../../assets/images/Afghani-Tandoor.jpg"),
  "Chicken Sheekh Kabab":   require("../../../assets/images/Chicken-Sheekh-Kabab.jpg"),
  "Mutton Sheekh Kebab":    require("../../../assets/images/Mutton-Sheekh-Kebab.jpg"),
  "Chicken Tikka Kebab":    require("../../../assets/images/Chicken-Tikka-Kebab.jpg"),
  "Chicken Tangadi Kebab":  require("../../../assets/images/Chicken-Tangadi-Kebab.jpg"),
  "Lahsuni Kebab":          require("../../../assets/images/Lahsuni-Kebab.jpg"),
  "Paneer Tikka Kebab":     require("../../../assets/images/Paneer-Tikka-Kebab.jpg"),
  "Speacial Paradise Kebab":require("../../../assets/images/Speacial-Paradise-Kebab.jpg"),
  "Chicken Hariyali Kebab": require("../../../assets/images/Chicken-Hariyali-Kebab.jpg"),
  "Paneer Kalimiri kebab":  require("../../../assets/images/Paneer-Kalimiri-kebab.jpg"),
  "Chicken Kalimiri kebab": require("../../../assets/images/Chicken-Kalimiri-kebab.jpg"),
  "Tandoor Chicken Red":    require("../../../assets/images/Tandoor-Chicken-Red.jpg"),
  "Tandoor Chicken White":  require("../../../assets/images/Tandoor-chicken-White.jpg"),
  "Tandoori Lollipop":      require("../../../assets/images/Tandoori-Lollipop.jpg"),
  "Reshmi Kebab":           require("../../../assets/images/Reshmi-Kebab.jpg"),
};

interface MenuItemCardProps {
  item: MenuItem;
  qty: number;
  onChangeQty: (qty: number) => void;
}

export function MenuItemCard({ item, qty, onChangeQty }: MenuItemCardProps) {
  return (
    <View style={[styles.card, qty > 0 && styles.selected]}>
      <Image
        source={
          item.imageUrl
            ? { uri: item.imageUrl }
            : menuImages[item.name as keyof typeof menuImages] ||
              require("../../../assets/images/Veg-Dum-Biryani.jpg")
        }
        style={styles.foodImage}
        resizeMode="cover"
      />
      <View style={styles.details}>
        <Text numberOfLines={2} style={styles.name}>
          {item.name}
        </Text>
        <Text style={styles.price}>({formatCurrency(item.price)})</Text>
      </View>
      <View style={styles.qtyContainer}>
        <QtyControl qty={qty} onDecrement={() => onChangeQty(Math.max(0, qty - 1))} onIncrement={() => onChangeQty(qty + 1)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "column",
    flex: 1,
    maxWidth: "48%",
    marginHorizontal: "1%",
    marginVertical: 6,
    height: 250,
    padding: 12,
    alignItems: "stretch",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  foodImage: {
    width: "100%",
    height: 110,
    borderRadius: 16,
  },
  selected: {
    borderColor: COLORS.primaryMid,
    borderWidth: 1.5,
    backgroundColor: COLORS.primaryLight,
  },
  details: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 20,
  },
  price: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },
  qtyContainer: {
    alignItems: "center",
    marginTop: 8,
  },
});
