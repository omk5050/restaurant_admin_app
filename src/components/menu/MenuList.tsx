import { useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

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
  const scrollOffset = useRef(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.x;
    scrollOffset.current = offset;
    setShowLeftArrow(offset > 10);
  };

  const handleScrollLeft = () => {
    flatListRef.current?.scrollToOffset({
      offset: Math.max(0, scrollOffset.current - 172),
      animated: true,
    });
  };

  const handleScrollRight = () => {
    flatListRef.current?.scrollToOffset({
      offset: scrollOffset.current + 172,
      animated: true,
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title} Items</Text>
      <View style={styles.listContainer}>
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <MenuItemCard item={item} qty={getQty(item.id)} onChangeQty={(qty) => onChangeQty(item, qty)} />
          )}
        />

        {showLeftArrow && (
          <Pressable onPress={handleScrollLeft} style={styles.arrowLeft}>
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
        )}

        {items.length > 2 && (
          <Pressable onPress={handleScrollRight} style={styles.arrowRight}>
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    height: 310,
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
  },
  listContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  list: {
    gap: 12,
    paddingHorizontal: 4,
    paddingRight: 32,
  },
  arrowLeft: {
    position: "absolute",
    left: 2,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  arrowRight: {
    position: "absolute",
    right: 2,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  arrowText: {
    fontSize: 22,
    color: COLORS.slate,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: -2,
  },
});
