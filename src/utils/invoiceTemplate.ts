import { AppSettings, Invoice } from "@/types";
import { getTableName } from "./formatters";

export function generateInvoiceHTML(invoice: Invoice, settings: AppSettings) {
  const rows = invoice.items
    .map(
      (item) => `
    <tr>
      <td style="padding:3px 0">${item.name}</td>
      <td style="text-align:center">x${item.qty}</td>
      <td style="text-align:right">${settings.currency}${item.price * item.qty}</td>
    </tr>`,
    )
    .join("");

  const tableRow = invoice.isTakeaway
    ? `<p>Type    : Takeaway (${getTableName(invoice.tableId, settings)})</p>
  <p>Customer: ${invoice.customerName}</p>
  <p>Phone   : ${invoice.customerPhone}</p>`
    : `<p>Table   : ${getTableName(invoice.tableId, settings)}</p>`;

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family:'Courier New',monospace; width:320px; margin:auto; font-size:15px; }
    h1 { text-align:center; font-size:19px; letter-spacing:3px; margin-bottom:4px; }
    .sub { text-align:center; font-size:12px; color:#666; margin:2px 0; }
    .dash { border-top:2px dashed #333; margin:10px 0; }
    table { width:100%; border-collapse:collapse; }
    .total { font-size:19px; font-weight:bold; }
    .center { text-align:center; }
  </style>
</head>
<body>
  <h1>${settings.restaurantName}</h1>
  <p class="sub">${settings.address}</p>
  <p class="sub">GST: ${settings.gstNumber}</p>
  <div class="dash"></div>
  ${tableRow}
  <p>Bill No : ${invoice.orderNo}</p>
  <p>Date    : ${new Date(invoice.createdAt).toLocaleString("en-IN")}</p>
  <p>Payment : ${invoice.paymentMethod.toUpperCase()}</p>
  <div class="dash"></div>
  <table>${rows}</table>
  <div class="dash"></div>
  <p>Subtotal : ${settings.currency}${invoice.subtotal}</p>
  <p>GST (${settings.gstPercent}%) : ${settings.currency}${invoice.gstAmount}</p>
  <div class="dash"></div>
  <p class="total">TOTAL : ${settings.currency}${invoice.total}</p>
  <div class="dash"></div>
  <p class="center">Thank You! Visit Again</p>
</body>
</html>`;
}
