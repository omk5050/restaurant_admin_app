import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/constants/colors";
import { MENU_SECTIONS, getSubCategories } from "@/constants/menuSections";
import { Category, MenuSection } from "@/types";

interface CategorySidebarProps {
  categories: Category[];
  selectedSection: MenuSection;
  selectedId: string;
  onSelectSection: (section: MenuSection) => void;
  onSelect: (id: string) => void;
}

export function CategorySidebar({
  categories,
  selectedSection,
  selectedId,
  onSelectSection,
  onSelect,
}: CategorySidebarProps) {
  const subCategories = getSubCategories(categories, selectedSection);

  return (
    <View style={styles.wrap}>
      {MENU_SECTIONS.length > 1 && (
        <View style={styles.sectionRow}>
          {MENU_SECTIONS.map((section) => {
            const selected = section.id === selectedSection;
            return (
              <Pressable
                key={section.id}
                onPress={() => onSelectSection(section.id)}
                style={[styles.sectionTab, selected && styles.sectionTabSelected]}
              >
                <Text style={styles.sectionIcon}>{section.icon}</Text>
                <Text style={[styles.sectionName, selected && styles.sectionNameSelected]}>
                  {section.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <FlatList
        data={subCategories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const selected = item.id === selectedId;
          return (
            <Pressable
              onPress={() => onSelect(item.id)}
              style={[styles.pill, selected && styles.selectedPill]}
            >
              <Text style={styles.icon}>{item.icon}</Text>
              <Text numberOfLines={1} style={[styles.name, selected && styles.selectedName]}>
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.white,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    gap: 8,
    paddingBottom: 10,
    paddingTop: 10,
  },
  sectionRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
  },
  sectionTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.grayLight,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  sectionTabSelected: {
    backgroundColor: COLORS.espresso,
    borderColor: COLORS.espresso,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionName: {
    color: COLORS.textSec,
    fontSize: 14,
    fontWeight: "700",
  },
  sectionNameSelected: {
    color: COLORS.white,
    fontWeight: "800",
  },
  listContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: COLORS.grayLight,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  selectedPill: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  icon: {
    fontSize: 16,
  },
  name: {
    color: COLORS.textSec,
    fontSize: 13,
    fontWeight: "600",
  },
  selectedName: {
    color: COLORS.primary,
    fontWeight: "800",
  },
});
