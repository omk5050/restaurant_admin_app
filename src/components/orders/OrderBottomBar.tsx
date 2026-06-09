import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { COLORS } from "@/constants/colors";

interface OrderBottomBarProps {
  onKotPress: () => void;
  onHoldPress: () => void;
  onAddCustomItem: (name: string, price: number) => void;
}

export function OrderBottomBar({ onKotPress, onHoldPress, onAddCustomItem }: OrderBottomBarProps) {
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");

  const handleAddCustom = () => {
    let valid = true;
    setNameError("");
    setPriceError("");

    if (!customName.trim()) {
      setNameError("Item name is required.");
      valid = false;
    }
    const parsedPrice = parseFloat(customPrice);
    if (!customPrice.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      setPriceError("Enter a valid price greater than 0.");
      valid = false;
    }

    if (!valid) return;

    onAddCustomItem(customName.trim(), parsedPrice);
    setCustomModalVisible(false);
    setCustomName("");
    setCustomPrice("");
  };

  const handleClose = () => {
    setCustomModalVisible(false);
    setCustomName("");
    setCustomPrice("");
    setNameError("");
    setPriceError("");
  };

  return (
    <>
      <View style={styles.bar}>
        <TouchableOpacity style={[styles.sideBtn, styles.holdBtn]} onPress={onHoldPress} activeOpacity={0.8}>
          <Text style={styles.holdText}>⏸ Hold</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.centerBtn]} onPress={() => setCustomModalVisible(true)} activeOpacity={0.8}>
          <Text style={styles.customText}>＋ Add Custom Item</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.sideBtn, styles.kotBtn]} onPress={onKotPress} activeOpacity={0.8}>
          <Text style={styles.kotText}>🖨 KOT</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Item Modal */}
      <Modal visible={customModalVisible} animationType="slide" transparent onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Custom Item</Text>
            <Text style={styles.modalSubtitle}>This item will be added to this bill only and won't save to the menu.</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Item Name</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                placeholder="e.g. Special Thali"
                placeholderTextColor="#bbb"
                value={customName}
                onChangeText={(t) => { setCustomName(t); setNameError(""); }}
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Price (₹)</Text>
              <TextInput
                style={[styles.input, priceError ? styles.inputError : null]}
                placeholder="e.g. 120"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
                value={customPrice}
                onChangeText={(t) => { setCustomPrice(t); setPriceError(""); }}
              />
              {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={handleAddCustom}>
                <Text style={styles.addText}>Add to Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  sideBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  holdBtn: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
  },
  holdText: {
    color: "#c2410c",
    fontWeight: "700",
    fontSize: 13,
  },
  kotBtn: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
  },
  kotText: {
    color: "#15803d",
    fontWeight: "700",
    fontSize: 13,
  },
  centerBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minHeight: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  customText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSec,
    textAlign: "center",
    marginTop: -8,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSec,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: "#fafafa",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    color: COLORS.textSec,
    fontWeight: "700",
    fontSize: 14,
  },
  addBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    alignItems: "center",
  },
  addText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
