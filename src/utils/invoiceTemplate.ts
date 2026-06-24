import { AppSettings, Invoice } from "@/types";
import { getTableName } from "./formatters";

export function generateInvoiceHTML(invoice: Invoice, settings: AppSettings) {
  const rows = invoice.items
    .map(
      (item) => `
    <tr>
      <td style="padding:4px 0; font-weight:bold;">${item.name}</td>
      <td style="text-align:center; font-weight:bold;">x${item.qty}</td>
      <td style="text-align:right; font-weight:bold;">${settings.currency}${item.price * item.qty}</td>
    </tr>`,
    )
    .join("");

  const tableRow = invoice.isTakeaway
    ? `<p style="font-weight:bold; margin: 4px 0;">TYPE: Takeaway (${getTableName(invoice.tableId, settings)})</p>
  <p style="font-weight:bold; margin: 4px 0;">CUST: ${invoice.customerName}</p>
  <p style="font-weight:bold; margin: 4px 0;">PHONE: ${invoice.customerPhone}</p>`
    : `<p style="font-weight:bold; margin: 4px 0;">TABLE: ${getTableName(invoice.tableId, settings)}</p>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family:'Courier New',Courier,monospace; width:290px; margin:0 auto; font-size:17px; line-height:1.4; color:#000; }
    h1 { text-align:center; font-size:24px; font-weight:bold; letter-spacing:2px; margin:0 0 4px 0; text-transform:uppercase; }
    .sub { text-align:center; font-size:14px; margin:3px 0; font-weight:bold; }
    .dash { border-top:2px dashed #000; margin:12px 0; }
    table { width:100%; border-collapse:collapse; font-size:17px; }
    .total { font-size:22px; font-weight:bold; margin: 8px 0; }
    .center { text-align:center; font-weight:bold; }
    p { margin: 6px 0; }
  </style>
</head>
<body>
  <h1>${settings.restaurantName}</h1>
  <p class="sub">${settings.address}</p>
  <p class="sub">GST: ${settings.gstNumber}</p>
  <div class="dash"></div>
  ${tableRow}
  <p style="font-weight:bold;">BILL NO : ${invoice.orderNo}</p>
  <p style="font-weight:bold;">DATE    : ${new Date(invoice.createdAt).toLocaleString("en-IN")}</p>
  <p style="font-weight:bold;">PAYMENT : ${invoice.paymentMethod.toUpperCase()}</p>
  <div class="dash"></div>
  <table>${rows}</table>
  <div class="dash"></div>
  <p style="font-weight:bold;">Subtotal : ${settings.currency}${invoice.subtotal}</p>
  <p style="font-weight:bold;">GST (${settings.gstPercent}%) : ${settings.currency}${invoice.gstAmount}</p>
  <div class="dash"></div>
  <p class="total">TOTAL : ${settings.currency}${invoice.total}</p>
  <div class="dash"></div>
  <p class="center">Thank You! Visit Again</p>
</body>
</html>`;
}
