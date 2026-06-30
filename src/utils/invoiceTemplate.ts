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
    ? `<p style="font-weight:bold; margin: 4px 0;">TYPE: Takeaway (${getTableName(invoice.tableId, settings)})</p>`
    : `<p style="font-weight:bold; margin: 4px 0;">TABLE: ${getTableName(invoice.tableId, settings)}</p>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 10px;
      font-family: 'Courier New', Courier, monospace;
      width: 280px;
      height: auto !important;
      overflow: visible;
    }
    body {
      font-size: 16px;
      line-height: 1.3;
      color: #000;
    }
    h1 { text-align:center; font-size:22px; font-weight:bold; letter-spacing:1px; margin:0 0 4px 0; text-transform:uppercase; }
    .sub { text-align:center; font-size:13px; margin:3px 0; font-weight:bold; }
    .dash { border-top:2px dashed #000; margin:10px 0; }
    table { width:100%; border-collapse:collapse; font-size:16px; }
    .total { font-size:20px; font-weight:bold; margin: 6px 0; }
    .center { text-align:center; font-weight:bold; }
    p { margin: 4px 0; }
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

export function generateKotHTML(order: any, table: any, settings: AppSettings, comment?: string) {
  const rows = order.items
    .map(
      (item: any) => `
    <tr>
      <td style="padding:6px 0; font-weight:bold; font-size:20px;">${item.name}</td>
      <td style="text-align:right; font-weight:bold; font-size:24px;">x${item.qty}</td>
    </tr>`,
    )
    .join("");

  const commentSection = comment && comment.trim()
    ? `<div class="dash"></div>
  <p style="font-weight:bold; font-size:13px; text-transform:uppercase; margin-bottom:2px;">⚠ Kitchen Note:</p>
  <p style="font-weight:bold; font-size:16px; border:2px solid #000; padding:6px; border-radius:4px;">${comment.trim()}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 10px;
      font-family: 'Courier New', Courier, monospace;
      width: 280px;
      height: auto !important;
      overflow: visible;
    }
    body {
      font-size: 16px;
      line-height: 1.3;
      color: #000;
    }
    h1 { text-align:center; font-size:20px; font-weight:bold; margin:0 0 4px 0; text-transform:uppercase; }
    .dash { border-top:2px dashed #000; margin:10px 0; }
    table { width:100%; border-collapse:collapse; font-size:16px; }
    p { margin: 4px 0; }
  </style>
</head>
<body>
  <h1>KITCHEN ORDER (KOT)</h1>
  <div class="dash"></div>
  <p style="font-weight:bold; font-size:20px; margin: 4px 0;">TABLE/ORDER: ${table?.name || `Order #${order.orderNo}`}</p>
  <p style="font-weight:bold;">ORDER NO : ${order.orderNo}</p>
  <p style="font-weight:bold;">DATE     : ${new Date().toLocaleString("en-IN")}</p>
  <div class="dash"></div>
  <table>${rows}</table>
  ${commentSection}
  <div class="dash"></div>
  <p style="text-align:center; font-weight:bold;">Kitchen Copy</p>
</body>
</html>`;
}
