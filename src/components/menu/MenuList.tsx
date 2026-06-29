import { useRef } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { COLORS } from "@/constants/colors";
import { MenuItem } from "@/types";

interface MenuListProps {
  title: string;
  items: MenuItem[];
  getQty: (itemId: string) => number;
  onChangeQty: (item: MenuItem, qty: number) => void;
}

export function MenuList({ title, items, getQty, onChangeQty }: MenuListProps) {
  const flatListRef = useRef<FlatList>(null);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title} Items</Text>
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <MenuItemCard item={item} qty={getQty(item.id)} onChangeQty={(qty) => onChangeQty(item, qty)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 4,
    paddingBottom: 130,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 8,
  },
});
