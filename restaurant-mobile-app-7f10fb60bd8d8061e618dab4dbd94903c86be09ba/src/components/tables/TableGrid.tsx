import { FlatList, StyleSheet, View, useWindowDimensions } from "react-native";

import { TableCard } from "@/components/tables/TableCard";
import { Order, Table } from "@/types";

interface TableGridProps {
  tables: Table[];
  getOrderForTable: (tableId: number) => Order | undefined;
}

export function TableGrid({ tables, getOrderForTable }: TableGridProps) {
  const { width } = useWindowDimensions();
  const numColumns = width < 480 ? 2 : 3;

  return (
    <FlatList
      key={numColumns}
      data={tables}
      keyExtractor={(item) => String(item.id)}
      numColumns={numColumns}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <View style={[styles.item, { maxWidth: numColumns === 2 ? "48.5%" : "31.8%" }]}>
          <TableCard table={item} order={getOrderForTable(item.id)} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  row: {
    gap: 12,
  },
  item: {
    flex: 1,
    minWidth: 0,
  },
});
