const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const dns = require("dns");

dotenv.config();

// Override default DNS servers to Google Public DNS to resolve mongodb+srv SRV records reliably
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  console.log("DNS servers set to Google Public DNS (8.8.8.8, 8.8.4.4)");
} catch (dnsErr) {
  console.warn("Could not set custom DNS servers:", dnsErr.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==========================================
// 1. MONGODB CONNECTION
// ==========================================
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/restaurantdb";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully.");
    seedDatabase();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// ==========================================
// 2. MONGOOSE SCHEMAS & MODELS
// ==========================================
const SettingsSchema = new mongoose.Schema({
  restaurantName: { type: String, default: "Hotel Grand" },
  address: { type: String, default: "123 MG Road, Your City" },
  gstNumber: { type: String, default: "07AABC1234D1Z5" },
  gstPercent: { type: Number, default: 5 },
  currency: { type: String, default: "₹" },
  tableCount: { type: Number, default: 12 },
});
const Settings = mongoose.model("Settings", SettingsSchema);

const TableSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  seats: { type: Number, default: 4 },
  status: { type: String, enum: ["empty", "active", "bill", "paid"], default: "empty" },
  currentOrderId: { type: String, default: null },
});
const Table = mongoose.model("Table", TableSchema);

const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  sortOrder: { type: Number, default: 0 },
});
const Category = mongoose.model("Category", CategorySchema);

const MenuItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  categoryId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  emoji: { type: String, default: "🍔" },
  isAvailable: { type: Boolean, default: true },
  isVeg: { type: Boolean, default: true },
});
const MenuItem = mongoose.model("MenuItem", MenuItemSchema);

const OrderItemSchema = new mongoose.Schema({
  menuItemId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  notes: { type: String, default: "" },
});

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tableId: { type: Number, required: true },
  orderNo: { type: String, required: true },
  guests: { type: Number, default: 1 },
  status: { type: String, enum: ["open", "hold", "billed", "paid"], default: "open" },
  items: [OrderItemSchema],
  subtotal: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  openedAt: { type: String, required: true },
  closedAt: { type: String, default: null },
  paymentMethod: { type: String, default: null },
});
const Order = mongoose.model("Order", OrderSchema);

const InvoiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  tableId: { type: Number, required: true },
  orderNo: { type: String, required: true },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  gstAmount: { type: Number, required: true },
  total: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  createdAt: { type: String, required: true },
});
const Invoice = mongoose.model("Invoice", InvoiceSchema);

// ==========================================
// 3. DATABASE SEEDER
// ==========================================
async function seedDatabase() {
  try {
    // 1. Settings Seeding
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        restaurantName: "Hotel Grand",
        address: "123 MG Road, Your City",
        gstNumber: "07AABC1234D1Z5",
        gstPercent: 5,
        currency: "₹",
        tableCount: 12,
      });
      console.log("Seeded default settings.");
    }

    // 2. Categories Seeding
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        { id: "popular", name: "Popular", icon: "★", sortOrder: 0 },
        { id: "breakfast", name: "Breakfast", icon: "☀", sortOrder: 1 },
        { id: "main", name: "Main Course", icon: "🍛", sortOrder: 2 },
        { id: "rice", name: "Rice", icon: "🍚", sortOrder: 3 },
        { id: "beverages", name: "Beverages", icon: "🥤", sortOrder: 4 },
        { id: "snacks", name: "Snacks", icon: "🍟", sortOrder: 5 },
        { id: "desserts", name: "Desserts", icon: "🍰", sortOrder: 6 },
      ];
      await Category.insertMany(defaultCategories);
      console.log("Seeded default categories.");
    }

    // 3. Menu Items Seeding
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      const defaultMenu = [
        { id: "m1", categoryId: "popular", name: "Tea", price: 10, emoji: "☕", isAvailable: true, isVeg: true },
        { id: "m2", categoryId: "popular", name: "Coffee", price: 20, emoji: "☕", isAvailable: true, isVeg: true },
        { id: "m3", categoryId: "popular", name: "Misal", price: 60, emoji: "🥘", isAvailable: true, isVeg: true },
        { id: "m4", categoryId: "popular", name: "Biryani", price: 180, emoji: "🍛", isAvailable: true, isVeg: false },
        { id: "m5", categoryId: "popular", name: "Coke", price: 40, emoji: "🥤", isAvailable: true, isVeg: true },
        { id: "m6", categoryId: "popular", name: "Lassi", price: 40, emoji: "🥛", isAvailable: true, isVeg: true },
        { id: "m7", categoryId: "popular", name: "Buttermilk", price: 30, emoji: "🥛", isAvailable: true, isVeg: true },
        { id: "m8", categoryId: "popular", name: "Paneer Tikka", price: 120, emoji: "🍢", isAvailable: true, isVeg: true },
        { id: "m9", categoryId: "breakfast", name: "Dosa", price: 60, emoji: "🫓", isAvailable: true, isVeg: true },
        { id: "m10", categoryId: "breakfast", name: "Idli", price: 40, emoji: "🍚", isAvailable: true, isVeg: true },
        { id: "m11", categoryId: "breakfast", name: "Poha", price: 30, emoji: "🍚", isAvailable: true, isVeg: true },
        { id: "m12", categoryId: "breakfast", name: "Upma", price: 35, emoji: "🍚", isAvailable: true, isVeg: true },
        { id: "m13", categoryId: "breakfast", name: "Paratha", price: 50, emoji: "🫓", isAvailable: true, isVeg: true },
        { id: "m14", categoryId: "breakfast", name: "Omelette", price: 40, emoji: "🍳", isAvailable: true, isVeg: false },
        { id: "m15", categoryId: "main", name: "Dal Makhani", price: 120, emoji: "🥘", isAvailable: true, isVeg: true },
        { id: "m16", categoryId: "main", name: "Butter Chicken", price: 180, emoji: "🍗", isAvailable: true, isVeg: false },
        { id: "m17", categoryId: "main", name: "Paneer Butter Masala", price: 150, emoji: "🥘", isAvailable: true, isVeg: true },
        { id: "m18", categoryId: "main", name: "Palak Paneer", price: 140, emoji: "🥬", isAvailable: true, isVeg: true },
        { id: "m19", categoryId: "main", name: "Chicken Curry", price: 170, emoji: "🍗", isAvailable: true, isVeg: false },
        { id: "m20", categoryId: "rice", name: "Biryani", price: 180, emoji: "🍛", isAvailable: true, isVeg: false },
        { id: "m21", categoryId: "rice", name: "Fried Rice", price: 120, emoji: "🍚", isAvailable: true, isVeg: true },
        { id: "m22", categoryId: "rice", name: "Pulao", price: 100, emoji: "🍚", isAvailable: true, isVeg: true },
        { id: "m23", categoryId: "rice", name: "Curd Rice", price: 80, emoji: "🍚", isAvailable: true, isVeg: true },
        { id: "m24", categoryId: "beverages", name: "Tea", price: 10, emoji: "☕", isAvailable: true, isVeg: true },
        { id: "m25", categoryId: "beverages", name: "Coffee", price: 20, emoji: "☕", isAvailable: true, isVeg: true },
        { id: "m26", categoryId: "beverages", name: "Lassi", price: 40, emoji: "🥛", isAvailable: true, isVeg: true },
        { id: "m27", categoryId: "beverages", name: "Coke", price: 40, emoji: "🥤", isAvailable: true, isVeg: true },
        { id: "m28", categoryId: "beverages", name: "Fresh Lime", price: 30, emoji: "🍋", isAvailable: true, isVeg: true },
        { id: "m29", categoryId: "beverages", name: "Mango Shake", price: 60, emoji: "🥭", isAvailable: true, isVeg: true },
        { id: "m30", categoryId: "snacks", name: "Paneer Tikka", price: 120, emoji: "🍢", isAvailable: true, isVeg: true },
        { id: "m31", categoryId: "snacks", name: "Pav Bhaji", price: 80, emoji: "🫓", isAvailable: true, isVeg: true },
        { id: "m32", categoryId: "snacks", name: "French Fries", price: 60, emoji: "🍟", isAvailable: true, isVeg: true },
        { id: "m33", categoryId: "snacks", name: "Spring Roll", price: 70, emoji: "🥚", isAvailable: true, isVeg: true },
        { id: "m34", categoryId: "desserts", name: "Gulab Jamun", price: 40, emoji: "🍮", isAvailable: true, isVeg: true },
        { id: "m35", categoryId: "desserts", name: "Ice Cream", price: 60, emoji: "🍨", isAvailable: true, isVeg: true },
        { id: "m36", categoryId: "desserts", name: "Kulfi", price: 50, emoji: "🍦", isAvailable: true, isVeg: true },
        { id: "m37", categoryId: "desserts", name: "Kheer", price: 45, emoji: "🍮", isAvailable: true, isVeg: true },
      ];
      await MenuItem.insertMany(defaultMenu);
      console.log("Seeded default menu items.");
    }

    // 4. Invoices Seeding (for Analytics - we seed some past records)
    const invoiceCount = await Invoice.countDocuments();
    if (invoiceCount === 0) {
      // Seed some invoices for reports
      const now = new Date();
      const createPastDateISO = (daysAgo, hour = 13) => {
        const d = new Date(now);
        d.setDate(now.getDate() - daysAgo);
        d.setHours(hour, 0, 0, 0);
        return d.toISOString();
      };

      const pastInvoices = [
        // Today
        {
          id: "inv_s1",
          orderId: "ord_s1",
          tableId: 1,
          orderNo: "#1001",
          items: [{ menuItemId: "m4", name: "Biryani", price: 180, qty: 2 }],
          subtotal: 360,
          gstAmount: 18,
          total: 378,
          paymentMethod: "upi",
          createdAt: createPastDateISO(0, 11),
        },
        // Yesterday (to calculate growth comparison)
        {
          id: "inv_s2",
          orderId: "ord_s2",
          tableId: 3,
          orderNo: "#1002",
          items: [{ menuItemId: "m16", name: "Butter Chicken", price: 180, qty: 1 }],
          subtotal: 180,
          gstAmount: 9,
          total: 189,
          paymentMethod: "cash",
          createdAt: createPastDateISO(1, 12),
        },
        // Past week
        {
          id: "inv_s3",
          orderId: "ord_s3",
          tableId: 4,
          orderNo: "#1003",
          items: [{ menuItemId: "m17", name: "Paneer Butter Masala", price: 150, qty: 3 }],
          subtotal: 450,
          gstAmount: 23,
          total: 473,
          paymentMethod: "card",
          createdAt: createPastDateISO(2),
        },
        {
          id: "inv_s4",
          orderId: "ord_s4",
          tableId: 2,
          orderNo: "#1004",
          items: [{ menuItemId: "m20", name: "Biryani", price: 180, qty: 4 }],
          subtotal: 720,
          gstAmount: 36,
          total: 756,
          paymentMethod: "upi",
          createdAt: createPastDateISO(3),
        },
        {
          id: "inv_s5",
          orderId: "ord_s5",
          tableId: 6,
          orderNo: "#1005",
          items: [{ menuItemId: "m3", name: "Misal", price: 60, qty: 2 }],
          subtotal: 120,
          gstAmount: 6,
          total: 126,
          paymentMethod: "cash",
          createdAt: createPastDateISO(4),
        },
        {
          id: "inv_s6",
          orderId: "ord_s6",
          tableId: 7,
          orderNo: "#1006",
          items: [{ menuItemId: "m10", name: "Idli", price: 40, qty: 3 }],
          subtotal: 120,
          gstAmount: 6,
          total: 126,
          paymentMethod: "card",
          createdAt: createPastDateISO(5),
        },
        {
          id: "inv_s7",
          orderId: "ord_s7",
          tableId: 8,
          orderNo: "#1007",
          items: [{ menuItemId: "m9", name: "Dosa", price: 60, qty: 5 }],
          subtotal: 300,
          gstAmount: 15,
          total: 315,
          paymentMethod: "upi",
          createdAt: createPastDateISO(6),
        },
      ];
      await Invoice.insertMany(pastInvoices);
      console.log("Seeded default invoices for analytics.");
    }

    // 5. Orders Seeding
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      const defaultOrders = [
        {
          id: "ord_1025",
          tableId: 2,
          orderNo: "#1025",
          guests: 4,
          status: "open",
          items: [
            { menuItemId: "m1", name: "Tea", price: 10, qty: 2 },
            { menuItemId: "m2", name: "Coffee", price: 20, qty: 1 },
            { menuItemId: "m3", name: "Misal", price: 60, qty: 1 },
            { menuItemId: "m4", name: "Biryani", price: 180, qty: 1 },
            { menuItemId: "m5", name: "Coke", price: 40, qty: 1 },
          ],
          subtotal: 310,
          gstAmount: 16,
          total: 326,
          openedAt: new Date().toISOString(),
        },
        {
          id: "ord_1024",
          tableId: 5,
          orderNo: "#1024",
          guests: 3,
          status: "open",
          items: [
            { menuItemId: "m9", name: "Dosa", price: 60, qty: 2 },
            { menuItemId: "m24", name: "Tea", price: 10, qty: 2 },
          ],
          subtotal: 140,
          gstAmount: 7,
          total: 147,
          openedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
        },
        {
          id: "ord_1023",
          tableId: 9,
          orderNo: "#1023",
          guests: 2,
          status: "billed",
          items: [
            { menuItemId: "m16", name: "Butter Chicken", price: 180, qty: 1 },
            { menuItemId: "m20", name: "Biryani", price: 180, qty: 1 },
            { menuItemId: "m35", name: "Ice Cream", price: 60, qty: 1 },
          ],
          subtotal: 420,
          gstAmount: 21,
          total: 441,
          openedAt: new Date(Date.now() - 26 * 60 * 1000).toISOString(),
        },
      ];
      await Order.insertMany(defaultOrders);
      console.log("Seeded default orders.");
    }

    // 6. Tables Seeding
    const tableCountDb = await Table.countDocuments();
    if (tableCountDb === 0) {
      const activeOrders = await Order.find({ status: { $ne: "paid" } });
      const defaultTables = Array.from({ length: 12 }, (_, index) => {
        const id = index + 1;
        const order = activeOrders.find((item) => item.tableId === id);
        return {
          id,
          name: `T${id}`,
          seats: 4,
          status: id === 12 ? "paid" : order?.status === "billed" ? "bill" : order ? "active" : "empty",
          currentOrderId: order ? order.id : null,
        };
      });
      await Table.insertMany(defaultTables);
      console.log("Seeded default tables.");
    }
  } catch (error) {
    console.error("Seeding database failed:", error);
  }
}

// ==========================================
// 4. API ENDPOINTS
// ==========================================

// Helper function to calculate subtotal, gst, total
function calculateTotal(items, gstPercent = 5) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const gstAmount = Math.round(subtotal * (gstPercent / 100));
  return {
    subtotal,
    gstAmount,
    total: subtotal + gstAmount,
  };
}

// --- SETTINGS ---
app.get("/api/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const { restaurantName, address, gstNumber, gstPercent, currency, tableCount } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const oldTableCount = settings.tableCount;
    const newTableCount = Number(tableCount);

    if (newTableCount !== oldTableCount) {
      if (newTableCount > oldTableCount) {
        // Create tables from oldTableCount + 1 to newTableCount
        const newTables = [];
        for (let i = oldTableCount + 1; i <= newTableCount; i++) {
          newTables.push({
            id: i,
            name: `T${i}`,
            seats: 4,
            status: "empty",
            currentOrderId: null,
          });
        }
        await Table.insertMany(newTables);
      } else {
        // Check if any tables that will be deleted are active
        const activeTablesCount = await Table.countDocuments({
          id: { $gt: newTableCount },
          status: { $in: ["active", "bill"] },
        });

        if (activeTablesCount > 0) {
          return res.status(400).json({
            error: "Cannot decrease table count. Some of the tables being removed have active orders.",
          });
        }

        // Delete tables with id > newTableCount
        await Table.deleteMany({ id: { $gt: newTableCount } });
      }
    }

    settings.restaurantName = restaurantName;
    settings.address = address;
    settings.gstNumber = gstNumber;
    settings.gstPercent = Number(gstPercent);
    settings.currency = currency;
    settings.tableCount = newTableCount;

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TABLES ---
app.get("/api/tables", async (req, res) => {
  try {
    const tables = await Table.find().sort({ id: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tables/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const table = await Table.findOneAndUpdate(
      { id: Number(req.params.id) },
      { status },
      { new: true }
    );
    res.json(table);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tables/:id/clear", async (req, res) => {
  try {
    const table = await Table.findOneAndUpdate(
      { id: Number(req.params.id) },
      { status: "empty", currentOrderId: null },
      { new: true }
    );
    res.json(table);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CATEGORIES ---
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MENU ITEMS ---
app.get("/api/menu", async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/menu", async (req, res) => {
  try {
    const { categoryId, name, price, emoji, isAvailable, isVeg } = req.body;
    const id = "m_" + Date.now();
    const menuItem = await MenuItem.create({
      id,
      categoryId,
      name,
      price: Number(price),
      emoji: emoji || "🍔",
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      isVeg: isVeg !== undefined ? isVeg : true,
    });
    res.json(menuItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/menu/:id", async (req, res) => {
  try {
    await MenuItem.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ORDERS & INVOICES ---
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { tableId, guests } = req.body;
    const totalOrders = await Order.countDocuments();
    const orderNo = `#${1026 + totalOrders}`;
    const id = "ord_" + Date.now();

    const order = await Order.create({
      id,
      tableId: Number(tableId),
      orderNo,
      guests: Number(guests),
      status: "open",
      items: [],
      subtotal: 0,
      gstAmount: 0,
      total: 0,
      openedAt: new Date().toISOString(),
    });

    await Table.findOneAndUpdate(
      { id: Number(tableId) },
      { status: "active", currentOrderId: id }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/orders/:id/items", async (req, res) => {
  try {
    const { items } = req.body; // Array of items
    const settings = await Settings.findOne() || { gstPercent: 5 };
    const { subtotal, gstAmount, total } = calculateTotal(items, settings.gstPercent);

    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      { items, subtotal, gstAmount, total },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders/:id/bill", async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      { status: "billed" },
      { new: true }
    );
    await Table.findOneAndUpdate(
      { id: order.tableId },
      { status: "bill" }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders/:id/pay", async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const closedAt = new Date().toISOString();

    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      { status: "paid", closedAt, paymentMethod },
      { new: true }
    );

    const invoiceId = "inv_" + Date.now();
    const invoice = await Invoice.create({
      id: invoiceId,
      orderId: order.id,
      tableId: order.tableId,
      orderNo: order.orderNo,
      items: order.items,
      subtotal: order.subtotal,
      gstAmount: order.gstAmount,
      total: order.total,
      paymentMethod,
      createdAt: closedAt,
    });

    await Table.findOneAndUpdate(
      { id: order.tableId },
      { status: "paid" }
    );

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/invoices", async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ANALYTICS ---
app.get("/api/analytics", async (req, res) => {
  try {
    const now = new Date();
    
    // Start of today (local midnight)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    // Start of yesterday
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    
    // Today's invoices
    const todayInvoices = await Invoice.find({ createdAt: { $gte: todayStart } });
    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Yesterday's invoices
    const yesterdayInvoices = await Invoice.find({
      createdAt: { $gte: yesterdayStart, $lt: todayStart },
    });
    const yesterdaySales = yesterdayInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Comparison growth %
    let todaySalesComparison = 18; // fallback if yesterday sales is 0
    if (yesterdaySales > 0) {
      todaySalesComparison = Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);
    } else if (todaySales > 0) {
      todaySalesComparison = 100;
    }

    // Active/Billed/Paid/Empty counts
    const activeTablesCount = await Table.countDocuments({ status: "active" });
    const billedTablesCount = await Table.countDocuments({ status: "bill" });
    const paidTablesCount = await Table.countDocuments({ status: "paid" });
    const emptyTablesCount = await Table.countDocuments({ status: "empty" });
    const openOrdersCount = await Order.countDocuments({ status: { $ne: "paid" } });

    // Weekly sales (group last 7 days Mon-Sun)
    // For simplicity, find the last 7 days including today
    const weeklySales = [];
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
      
      const dayInvoices = await Invoice.find({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      });
      const daySales = dayInvoices.reduce((sum, inv) => sum + inv.total, 0);
      weeklySales.push({
        label: weekdays[d.getDay()],
        value: daySales,
      });
    }

    // Monthly sales (group last 6 months)
    const monthlySales = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();

      const monthInvoices = await Invoice.find({
        createdAt: { $gte: startOfMonth, $lt: endOfMonth },
      });
      const monthSales = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
      monthlySales.push({
        label: monthNames[d.getMonth()],
        value: monthSales,
      });
    }

    // Ticket averages
    const allInvoices = await Invoice.find();
    const averageTicket = allInvoices.length
      ? Math.round(allInvoices.reduce((sum, inv) => sum + inv.total, 0) / allInvoices.length)
      : 0;

    // Month Pace
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const currentMonthInvoices = await Invoice.find({ createdAt: { $gte: currentMonthStart } });
    const monthPace = currentMonthInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Latest order opened time
    const latestOrder = await Order.findOne().sort({ openedAt: -1 });
    const latestOrderOpenedAt = latestOrder ? latestOrder.openedAt : new Date().toISOString();

    res.json({
      todaySales,
      todaySalesComparison,
      openOrdersCount,
      activeTablesCount,
      billedTablesCount,
      paidTablesCount,
      emptyTablesCount,
      weeklySales,
      monthlySales,
      averageTicket,
      paidCount: todayInvoices.length,
      activeCount: openOrdersCount,
      monthPace,
      latestOrderOpenedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Background job to auto-clear paid tables after 5 minutes grace period
setInterval(async () => {
  try {
    const paidTables = await Table.find({ status: "paid" });
    const now = new Date();
    
    for (const table of paidTables) {
      // Find the latest paid invoice for this table
      const latestInvoice = await Invoice.findOne({ tableId: table.id }).sort({ createdAt: -1 });
      if (latestInvoice) {
        const paidTime = new Date(latestInvoice.createdAt);
        const diffMs = now - paidTime;
        const diffMins = diffMs / 1000 / 60;
        
        if (diffMins >= 5) {
          table.status = "empty";
          table.currentOrderId = null;
          await table.save();
          console.log(`Auto-cleared Table T${table.id} after 5 minutes grace period.`);
        }
      } else {
        // Fallback: If no invoice is found but the table is marked paid, clear it
        table.status = "empty";
        table.currentOrderId = null;
        await table.save();
        console.log(`Auto-cleared Table T${table.id} (no invoice found).`);
      }
    }
  } catch (err) {
    console.error("Auto-clear background job error:", err.message);
  }
}, 10000); // Run every 10 seconds

// ==========================================
// 5. SERVER START
// ==========================================
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
