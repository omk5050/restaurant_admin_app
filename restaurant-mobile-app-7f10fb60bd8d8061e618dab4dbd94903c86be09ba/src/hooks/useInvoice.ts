import { Alert, Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { useOrderStore } from "@/store/orderStore";
import { useSettingsStore } from "@/store/settingsStore";
import { generateInvoiceHTML } from "@/utils/invoiceTemplate";
import { Invoice } from "@/types";

export function useInvoice(orderId?: string) {
  const invoices = useOrderStore((state) => state.invoices);
  const settings = useSettingsStore((state) => state.settings);
  const invoice = invoices.find((item) => item.orderId === orderId) ?? invoices.find((item) => item.id === orderId);

  const printReceipt = async (targetInvoice: Invoice) => {
    try {
      const html = generateInvoiceHTML(targetInvoice, settings);
      if (Platform.OS === "web") {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
          }, 500);
        }
      } else {
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      Alert.alert("Error", "Could not print the receipt.");
    }
  };

  const shareAsPDF = async (targetInvoice: Invoice) => {
    try {
      const html = generateInvoiceHTML(targetInvoice, settings);
      const filename = `Invoice_${targetInvoice.orderNo || targetInvoice.id}.pdf`;

      if (Platform.OS === "web") {
        if ((window as any).html2pdf) {
          (window as any).html2pdf().from(html).save(filename);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        script.onload = () => {
          (window as any).html2pdf().from(html).save(filename);
        };
        script.onerror = () => {
          // Fallback if CDN is down: trigger standard print where user can select "Save as PDF"
          printReceipt(targetInvoice);
        };
        document.head.appendChild(script);
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: `Share Invoice PDF`,
            UTI: "com.adobe.pdf",
          });
        } else {
          Alert.alert("Not Supported", "Sharing is not available on this device.");
        }
      }
    } catch (error) {
      console.error("Error sharing PDF:", error);
      Alert.alert("Error", "Could not generate or share the PDF invoice.");
    }
  };

  return {
    invoice,
    invoices,
    settings,
    printReceipt,
    shareAsPDF,
  };
}
