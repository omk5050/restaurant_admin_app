const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const dns = require("dns");
const authenticateToken = require("./authenticationmiddleware");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });


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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.url}`);
  res.on("finish", () => {
    console.log(`[API Response] ${req.method} ${req.url} -> Status: ${res.statusCode}`);
  });
  next();
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname, "../dist")));

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
  adminId: { type: String, required: true, unique: true },
  restaurantName: { type: String, default: "Hotel Grand" },
  address: { type: String, default: "123 MG Road, Your City" },
  gstNumber: { type: String, default: "07AABC1234D1Z5" },
  gstPercent: { type: Number, default: 5 },
  currency: { type: String, default: "₹" },
  tableCount: { type: Number, default: 14 },
  restaurantTableCount: { type: Number, default: 6 },
  familyTableCount: { type: Number, default: 4 },
  takeawayTableCount: { type: Number, default: 4 },
});
const Settings = mongoose.model("Settings", SettingsSchema);

const TableSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  id: { type: Number, required: true },
  name: { type: String, required: true },
  seats: { type: Number, default: 4 },
  status: { type: String, enum: ["empty", "active", "bill", "paid"], default: "empty" },
  currentOrderId: { type: String, default: null },
});
TableSchema.index({ adminId: 1, id: 1 }, { unique: true });
const Table = mongoose.model("Table", TableSchema);

const CategorySchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  sortOrder: { type: Number, default: 0 },
  section: { type: String, enum: ["restaurant", "cafe"], default: "restaurant" },
});
CategorySchema.index({ adminId: 1, id: 1 }, { unique: true });
const Category = mongoose.model("Category", CategorySchema);

const MenuItemSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  id: { type: String, required: true },
  categoryId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  emoji: { type: String, default: "🍔" },
  isAvailable: { type: Boolean, default: true },
  isVeg: { type: Boolean, default: true },
  imageUrl: { type: String, default: "" },
  shortCode: { type: String, default: "" },
});
MenuItemSchema.index({ adminId: 1, id: 1 }, { unique: true });
const MenuItem = mongoose.model("MenuItem", MenuItemSchema);

const OrderItemSchema = new mongoose.Schema({
  menuItemId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  notes: { type: String, default: "" },
});

const OrderSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  id: { type: String, required: true },
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
  isTakeaway: { type: Boolean, default: false },
  customerName: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
});
OrderSchema.index({ adminId: 1, id: 1 }, { unique: true });
const Order = mongoose.model("Order", OrderSchema);

const InvoiceSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  id: { type: String, required: true },
  orderId: { type: String, required: true },
  tableId: { type: Number, required: true },
  orderNo: { type: String, required: true },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  gstAmount: { type: Number, required: true },
  total: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  createdAt: { type: String, required: true },
  isTakeaway: { type: Boolean, default: false },
  customerName: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
});
InvoiceSchema.index({ adminId: 1, id: 1 }, { unique: true });
const Invoice = mongoose.model("Invoice", InvoiceSchema);

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "super-admin"], required: true },
  name: { type: String, required: true },
  createdAt: { type: String, required: true },
  subscriptionPaid: { type: Boolean, default: true },
  authoritiesEnabled: { type: Boolean, default: true },
});
const User = mongoose.model("User", UserSchema);

const RegistrationRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  restaurantName: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: String, required: true },
});
const RegistrationRequest = mongoose.model("RegistrationRequest", RegistrationRequestSchema);

const REQUIRED_CATEGORIES = [
  { id: "popular", name: "Popular", icon: "★", sortOrder: 0, section: "restaurant" },
  { id: "starters", name: "Starters", icon: "🥗", sortOrder: 1, section: "restaurant" },
  { id: "main", name: "Main Course", icon: "🍛", sortOrder: 2, section: "restaurant" },
  { id: "rice", name: "Rice", icon: "🍚", sortOrder: 3, section: "restaurant" },
  { id: "beverages", name: "Beverages", icon: "🥤", sortOrder: 0, section: "cafe" },
  { id: "snacks", name: "Snacks", icon: "🍟", sortOrder: 1, section: "cafe" },
  { id: "desserts", name: "Desserts", icon: "🍰", sortOrder: 2, section: "cafe" },
];

const REQUIRED_MENU_ITEMS = [
  // Desserts
  { id: "m38", categoryId: "desserts", name: "Tripple Choco Bowl", price: 150, emoji: "🍫", isAvailable: true, isVeg: true },
  { id: "m39", categoryId: "desserts", name: "Oreo Choco Bowl", price: 160, emoji: "🍪", isAvailable: true, isVeg: true },
  // Snacks
  { id: "m40", categoryId: "snacks", name: "French Fries Classic", price: 80, emoji: "🍟", isAvailable: true, isVeg: true },
  { id: "m41", categoryId: "snacks", name: "Peri Peri French Fries", price: 100, emoji: "🌶️", isAvailable: true, isVeg: true },
  { id: "m46", categoryId: "snacks", name: "Tandoori Lollipop", price: 220, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m47", categoryId: "snacks", name: "Reshmi Kebab", price: 240, emoji: "🍢", isAvailable: true, isVeg: false },
  // Rice
  { id: "m42", categoryId: "rice", name: "Veg Dum Biryani", price: 180, emoji: "🍛", isAvailable: true, isVeg: true },
  { id: "m43", categoryId: "rice", name: "Egg Dum Biryani", price: 200, emoji: "🍳", isAvailable: true, isVeg: false },
  { id: "m44", categoryId: "rice", name: "Paneer Tikka Biryani", price: 220, emoji: "🍢", isAvailable: true, isVeg: true },
  { id: "m48", categoryId: "rice", name: "Chicken Dum Biryani", price: 240, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m49", categoryId: "rice", name: "Mutton Dum Biryani", price: 280, emoji: "🐑", isAvailable: true, isVeg: false },
  { id: "m50", categoryId: "rice", name: "Chicken Tikka Biryani", price: 260, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m51", categoryId: "rice", name: "Tandoori Biryani", price: 260, emoji: "🔥", isAvailable: true, isVeg: false },
  // Main Course
  { id: "m45", categoryId: "main", name: "Paneer Kalimiri Kabab", price: 180, emoji: "🫕", isAvailable: true, isVeg: true },
  { id: "m52", categoryId: "main", name: "Afghani Tandoor", price: 320, emoji: "🔥", isAvailable: true, isVeg: false },
  { id: "m53", categoryId: "main", name: "Chicken Sheekh Kabab", price: 260, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m54", categoryId: "main", name: "Mutton Sheekh Kebab", price: 300, emoji: "🐑", isAvailable: true, isVeg: false },
  { id: "m55", categoryId: "main", name: "Chicken Tikka Kebab", price: 260, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m56", categoryId: "main", name: "Chicken Tangadi Kebab", price: 280, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m57", categoryId: "main", name: "Lahsuni Kebab", price: 240, emoji: "🧄", isAvailable: true, isVeg: false },
  { id: "m58", categoryId: "main", name: "Paneer Tikka Kebab", price: 220, emoji: "🧀", isAvailable: true, isVeg: true },
  { id: "m59", categoryId: "main", name: "Speacial Paradise Kebab", price: 350, emoji: "⭐", isAvailable: true, isVeg: false },
  { id: "m60", categoryId: "main", name: "Chicken Hariyali Kebab", price: 260, emoji: "🌿", isAvailable: true, isVeg: false },
  { id: "m61", categoryId: "main", name: "Paneer Kalimiri kebab", price: 200, emoji: "🧀", isAvailable: true, isVeg: true },
  { id: "m62", categoryId: "main", name: "Chicken Kalimiri kebab", price: 260, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m63", categoryId: "main", name: "Tandoor Chicken Red", price: 280, emoji: "🔴", isAvailable: true, isVeg: false },
  { id: "m64", categoryId: "main", name: "Tandoor Chicken White", price: 280, emoji: "⚪", isAvailable: true, isVeg: false },
];

function getScopedId(baseId, adminId, usesSuffixedIds) {
  return usesSuffixedIds ? `${baseId}_${adminId}` : baseId;
}

async function ensureDefaultMenuData(adminId) {
  if (!adminId) return;

  const categories = await Category.find({ adminId });
  const usesSuffixedIds = categories.length > 0
    ? categories.some((category) => category.id.endsWith(`_${adminId}`))
    : true;

  // 1. Create categories if they don't exist for this admin (i.e. categories count is 0)
  if (categories.length === 0) {
    await Promise.all(REQUIRED_CATEGORIES.map((category) => {
      const id = getScopedId(category.id, adminId, usesSuffixedIds);
      return Category.findOneAndUpdate(
        { adminId, id },
        { ...category, id, adminId },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }));
  }

  // 2. Create default menu items if none exist for this admin
  const menuCount = await MenuItem.countDocuments({ adminId });
  if (menuCount === 0) {
    await Promise.all(REQUIRED_MENU_ITEMS.map((item) => {
      const id = getScopedId(item.id, adminId, usesSuffixedIds);
      const categoryId = getScopedId(item.categoryId, adminId, usesSuffixedIds);
      return MenuItem.findOneAndUpdate(
        { adminId, id },
        { ...item, id, categoryId, adminId },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }));
  }
}

function getTableName(id) {
  if (id >= 1 && id <= 6) return `R${id}`;
  if (id >= 7 && id <= 10) return `F${id - 6}`;
  if (id >= 11 && id <= 14) return `T${id - 10}`;
  return `Table ${id}`;
}

// ==========================================
// 3. DATABASE SEEDER
// ==========================================
async function seedDatabase() {
  try {
    // 0. Users Seeding
    const superadminExists = await User.findOne({ email: "superadmin@restaurant.com" });
    if (!superadminExists) {
      await User.create({
        email: "superadmin@restaurant.com",
        password: bcrypt.hashSync("superadmin123", 10),
        role: "super-admin",
        name: "Super Admin",
        createdAt: new Date().toISOString(),
      });
      console.log("Seeded default superadmin user.");
    }

    const adminExists = await User.findOne({ email: "admin@restaurant.com" });
    if (!adminExists) {
      await User.create({
        email: "admin@restaurant.com",
        password: bcrypt.hashSync("admin123", 10),
        role: "admin",
        name: "Manager Admin",
        createdAt: new Date().toISOString(),
        subscriptionPaid: true,
        authoritiesEnabled: true,
      });
      console.log("Seeded default admin user.");
    }

    const adminUser = await User.findOne({ email: "admin@restaurant.com" });
    if (!adminUser) {
      console.error("Default admin user not found. Seeding aborted.");
      return;
    }
    const adminId = adminUser._id.toString();

    // 1. Settings Seeding
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        adminId,
        restaurantName: "Hotel Paradise",
        address: "123 MG Road, Your City",
        gstNumber: "07AABC1234D1Z5",
        gstPercent: 5,
        currency: "₹",
        tableCount: 14,
        restaurantTableCount: 6,
        familyTableCount: 4,
        takeawayTableCount: 4,
      });
      console.log("Seeded default settings.");
    }

    // 2. Categories Seeding
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        { id: "popular", name: "Popular", icon: "★", sortOrder: 0, section: "restaurant" },
        { id: "starters", name: "Starters", icon: "🥗", sortOrder: 1, section: "restaurant" },
        { id: "main", name: "Main Course", icon: "🍛", sortOrder: 2, section: "restaurant" },
        { id: "rice", name: "Rice", icon: "🍚", sortOrder: 3, section: "restaurant" },
        { id: "beverages", name: "Beverages", icon: "🥤", sortOrder: 0, section: "cafe" },
        { id: "snacks", name: "Snacks", icon: "🍟", sortOrder: 1, section: "cafe" },
        { id: "desserts", name: "Desserts", icon: "🍰", sortOrder: 2, section: "cafe" },
      ];
      await Category.insertMany(defaultCategories.map(c => ({ ...c, adminId })));
      console.log("Seeded default categories.");
    }

    // 3. Menu Items Seeding
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      await MenuItem.insertMany(REQUIRED_MENU_ITEMS.map(m => ({ ...m, adminId })));
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
          items: [{ menuItemId: "m42", name: "Veg Dum Biryani", price: 180, qty: 2 }],
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
          items: [{ menuItemId: "m43", name: "Egg Dum Biryani", price: 200, qty: 1 }],
          subtotal: 200,
          gstAmount: 10,
          total: 210,
          paymentMethod: "cash",
          createdAt: createPastDateISO(1, 12),
        },
        // Past week
        {
          id: "inv_s3",
          orderId: "ord_s3",
          tableId: 4,
          orderNo: "#1003",
          items: [{ menuItemId: "m44", name: "Paneer Tikka Biryani", price: 220, qty: 3 }],
          subtotal: 660,
          gstAmount: 33,
          total: 693,
          paymentMethod: "card",
          createdAt: createPastDateISO(2),
        },
        {
          id: "inv_s4",
          orderId: "ord_s4",
          tableId: 2,
          orderNo: "#1004",
          items: [{ menuItemId: "m45", name: "Paneer Kalimiri Kabab", price: 180, qty: 4 }],
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
          items: [{ menuItemId: "m38", name: "Tripple Choco Bowl", price: 150, qty: 2 }],
          subtotal: 300,
          gstAmount: 15,
          total: 315,
          paymentMethod: "cash",
          createdAt: createPastDateISO(4),
        },
        {
          id: "inv_s6",
          orderId: "ord_s6",
          tableId: 7,
          orderNo: "#1006",
          items: [{ menuItemId: "m39", name: "Oreo Choco Bowl", price: 160, qty: 3 }],
          subtotal: 480,
          gstAmount: 24,
          total: 504,
          paymentMethod: "card",
          createdAt: createPastDateISO(5),
        },
        {
          id: "inv_s7",
          orderId: "ord_s7",
          tableId: 8,
          orderNo: "#1007",
          items: [{ menuItemId: "m40", name: "French Fries Classic", price: 80, qty: 5 }],
          subtotal: 400,
          gstAmount: 20,
          total: 420,
          paymentMethod: "upi",
          createdAt: createPastDateISO(6),
        },
      ];
      await Invoice.insertMany(pastInvoices.map(inv => ({ ...inv, adminId })));
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
            { menuItemId: "m42", name: "Veg Dum Biryani", price: 180, qty: 1 },
            { menuItemId: "m38", name: "Tripple Choco Bowl", price: 150, qty: 1 },
          ],
          subtotal: 330,
          gstAmount: 17,
          total: 347,
          openedAt: new Date().toISOString(),
        },
        {
          id: "ord_1024",
          tableId: 5,
          orderNo: "#1024",
          guests: 3,
          status: "open",
          items: [
            { menuItemId: "m43", name: "Egg Dum Biryani", price: 200, qty: 1 },
            { menuItemId: "m40", name: "French Fries Classic", price: 80, qty: 1 },
          ],
          subtotal: 280,
          gstAmount: 14,
          total: 294,
          openedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
        },
        {
          id: "ord_1023",
          tableId: 9,
          orderNo: "#1023",
          guests: 2,
          status: "billed",
          items: [
            { menuItemId: "m44", name: "Paneer Tikka Biryani", price: 220, qty: 1 },
            { menuItemId: "m39", name: "Oreo Choco Bowl", price: 160, qty: 1 },
          ],
          subtotal: 380,
          gstAmount: 19,
          total: 399,
          openedAt: new Date(Date.now() - 26 * 60 * 1000).toISOString(),
        },
      ];
      await Order.insertMany(defaultOrders.map(o => ({ ...o, adminId })));
      console.log("Seeded default orders.");
    }

    // 6. Tables Seeding
    const tableCountDb = await Table.countDocuments();
    if (tableCountDb === 0) {
      const activeOrders = await Order.find({ status: { $ne: "paid" } });
      const defaultTables = Array.from({ length: 14 }, (_, index) => {
        const id = index + 1;
        const order = activeOrders.find((item) => item.tableId === id);
        return {
          id,
          name: getTableName(id),
          seats: 4,
          status: id === 14 ? "paid" : order?.status === "billed" ? "bill" : order ? "active" : "empty",
          currentOrderId: order ? order.id : null,
        };
      });
      await Table.insertMany(defaultTables.map(t => ({ ...t, adminId })));
      console.log("Seeded default tables.");
    }
  } catch (error) {
    console.error("Seeding database failed:", error);
  }
}

// ==========================================
// 4. API ENDPOINTS
// ==========================================

// Helper to resolve current tenant's adminId
function resolveAdminId(req) {
  if (req.user) {
    if (req.user.role === "super-admin") {
      const selected = req.headers["x-selected-admin-id"] || req.query.adminId;
      if (selected) return selected;
    }
    return req.user.userId;
  }
  return null;
}

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

// --- AUTHENTICATION ---
const authRoutes = require("./authentucationroutes");
app.use("/api/auth", authRoutes);

// --- SETTINGS ---
app.get("/api/settings", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    let settings = await Settings.findOne({ adminId });
    if (!settings) {
      settings = await Settings.create({ adminId });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/settings", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const {
      restaurantName,
      address,
      gstNumber,
      gstPercent,
      currency,
      restaurantTableCount,
      familyTableCount,
      takeawayTableCount,
    } = req.body;
    let settings = await Settings.findOne({ adminId });
    if (!settings) {
      settings = new Settings({ adminId });
    }

    const rCount = Number(restaurantTableCount ?? 6);
    const fCount = Number(familyTableCount ?? 4);
    const tCount = Number(takeawayTableCount ?? 4);
    const newTableCount = rCount + fCount + tCount;

    const countsChanged =
      (settings.restaurantTableCount ?? 6) !== rCount ||
      (settings.familyTableCount ?? 4) !== fCount ||
      (settings.takeawayTableCount ?? 4) !== tCount;

    if (countsChanged) {
      // Check if there are ANY active or billed orders in the entire system
      const activeTablesCount = await Table.countDocuments({
        adminId,
        status: { $in: ["active", "bill"] },
      });

      if (activeTablesCount > 0) {
        return res.status(400).json({
          error: "Cannot change table counts while there are active or billed orders. Please clear all tables first.",
        });
      }

      // Delete all tables for this admin and recreate
      await Table.deleteMany({ adminId });

      const newTables = [];
      let currentId = 1;

      // 1. Restaurant
      for (let i = 1; i <= rCount; i++) {
        newTables.push({
          adminId,
          id: currentId,
          name: `R${i}`,
          seats: 4,
          status: "empty",
          currentOrderId: null,
        });
        currentId++;
      }

      // 2. Family Section
      for (let i = 1; i <= fCount; i++) {
        newTables.push({
          adminId,
          id: currentId,
          name: `F${i}`,
          seats: 4,
          status: "empty",
          currentOrderId: null,
        });
        currentId++;
      }

      // 3. Takeaway
      for (let i = 1; i <= tCount; i++) {
        newTables.push({
          adminId,
          id: currentId,
          name: `T${i}`,
          seats: 4,
          status: "empty",
          currentOrderId: null,
        });
        currentId++;
      }

      await Table.insertMany(newTables);
    }

    const oldGstPercent = settings.gstPercent ?? 5;
    const newGstPercent = Number(gstPercent ?? 5);

    settings.restaurantName = restaurantName;
    settings.address = address;
    settings.gstNumber = gstNumber;
    settings.gstPercent = newGstPercent;
    settings.currency = currency;
    settings.restaurantTableCount = rCount;
    settings.familyTableCount = fCount;
    settings.takeawayTableCount = tCount;
    settings.tableCount = newTableCount;

    await settings.save();

    if (oldGstPercent !== newGstPercent) {
      const activeOrders = await Order.find({ adminId, status: { $ne: "paid" } });
      for (const order of activeOrders) {
        const { subtotal, gstAmount, total } = calculateTotal(order.items || [], newGstPercent);
        await Order.findOneAndUpdate(
          { adminId, id: order.id },
          { subtotal, gstAmount, total }
        );
      }
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TABLES ---
app.get("/api/tables", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const tables = await Table.find({ adminId }).sort({ id: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tables/:id/status", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const { status } = req.body;
    const table = await Table.findOneAndUpdate(
      { adminId, id: Number(req.params.id) },
      { status },
      { new: true }
    );
    res.json(table);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tables/:id/clear", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const tableId = Number(req.params.id);

    // Find the table to check if there is an active order
    const tableData = await Table.findOne({ adminId, id: tableId });
    if (tableData && tableData.currentOrderId) {
      await Order.deleteOne({ adminId, id: tableData.currentOrderId });
    }

    // Delete any other open/billed orders for this table to avoid ghost orders
    await Order.deleteMany({ adminId, tableId, status: { $ne: "paid" } });

    const table = await Table.findOneAndUpdate(
      { adminId, id: tableId },
      { status: "empty", currentOrderId: null },
      { new: true }
    );
    res.json(table);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CATEGORIES ---
app.get("/api/categories", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    await ensureDefaultMenuData(adminId);
    const categories = await Category.find({ adminId }).sort({ sortOrder: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/categories", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const { name, icon, section } = req.body;
    if (!name || !icon) {
      return res.status(400).json({ error: "Name and icon are required." });
    }
    const lastCategory = await Category.findOne({ adminId, section }).sort({ sortOrder: -1 });
    const nextSortOrder = lastCategory ? lastCategory.sortOrder + 1 : 0;
    const uniqueId = `cat_${Date.now()}`;
    const newCategory = await Category.create({
      adminId,
      id: uniqueId,
      name,
      icon,
      section: section || "restaurant",
      sortOrder: nextSortOrder,
    });
    res.json(newCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/categories/:id", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const categoryId = req.params.id;
    const itemsCount = await MenuItem.countDocuments({ adminId, categoryId });
    if (itemsCount > 0) {
      return res.status(400).json({
        error: "Cannot delete category while it contains menu items. Please delete or reassign all items in this category first.",
      });
    }
    const deleted = await Category.findOneAndDelete({ adminId, id: categoryId });
    if (!deleted) {
      return res.status(404).json({ error: "Category not found." });
    }
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- UPLOAD ENDPOINT ---
app.post("/api/upload", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Upload to Cloudinary using file buffer
    cloudinary.uploader.upload_stream(
      { folder: "menu_items" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Cloudinary upload failed" });
        }
        res.json({ imageUrl: result.secure_url });
      }
    ).end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MENU ITEMS ---
app.get("/api/menu", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    await ensureDefaultMenuData(adminId);
    const menuItems = await MenuItem.find({ adminId });
    // Map to plain objects with a guaranteed 'id' field
    const items = menuItems.map((item) => ({
      id: item.id || item._id.toString(),
      categoryId: item.categoryId,
      name: item.name,
      price: item.price,
      emoji: item.emoji,
      isAvailable: item.isAvailable,
      isVeg: item.isVeg,
      imageUrl: item.imageUrl || "",
      shortCode: item.shortCode || "",
    }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/menu", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const { categoryId, name, price, emoji, isAvailable, isVeg, imageUrl, shortCode } = req.body;
    const id = "m_" + Date.now();
    const menuItem = await MenuItem.create({
      adminId,
      id,
      categoryId,
      name,
      price: Number(price),
      emoji: emoji || "🍔",
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      isVeg: isVeg !== undefined ? isVeg : true,
      imageUrl: imageUrl || "",
      shortCode: shortCode || "",
    });
    // Return clean mapped object (consistent with GET /api/menu)
    res.json({
      id: menuItem.id || menuItem._id.toString(),
      categoryId: menuItem.categoryId,
      name: menuItem.name,
      price: menuItem.price,
      emoji: menuItem.emoji,
      isAvailable: menuItem.isAvailable,
      isVeg: menuItem.isVeg,
      imageUrl: menuItem.imageUrl || "",
      shortCode: menuItem.shortCode || "",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/menu/:id", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const paramId = req.params.id;
    // Match by custom id field OR by MongoDB _id for safety
    const query = { adminId, $or: [{ id: paramId }, { _id: paramId.match(/^[a-f\d]{24}$/i) ? paramId : undefined }].filter(Boolean) };
    await MenuItem.deleteOne({ adminId, id: paramId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ORDERS & INVOICES ---
app.get("/api/orders", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const orders = await Order.find({ adminId });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const { tableId, guests, isTakeaway, customerName, customerPhone } = req.body;
    const totalOrders = await Order.countDocuments({ adminId });
    const orderNo = `#${1026 + totalOrders}`;
    const id = "ord_" + Date.now();

    const order = await Order.create({
      adminId,
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
      isTakeaway: !!isTakeaway,
      customerName: customerName || "",
      customerPhone: customerPhone || "",
    });

    await Table.findOneAndUpdate(
      { adminId, id: Number(tableId) },
      { status: "active", currentOrderId: id }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/orders/:id/items", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const { items, guests, customerName, customerPhone, isTakeaway } = req.body;
    const settings = await Settings.findOne({ adminId }) || { gstPercent: 5 };

    const updateFields = {};
    if (items !== undefined) {
      const { subtotal, gstAmount, total } = calculateTotal(items, settings.gstPercent);
      updateFields.items = items;
      updateFields.subtotal = subtotal;
      updateFields.gstAmount = gstAmount;
      updateFields.total = total;
    }
    if (guests !== undefined) {
      updateFields.guests = Number(guests);
    }
    if (customerName !== undefined) {
      updateFields.customerName = customerName;
    }
    if (customerPhone !== undefined) {
      updateFields.customerPhone = customerPhone;
    }
    if (isTakeaway !== undefined) {
      updateFields.isTakeaway = !!isTakeaway;
    }

    const order = await Order.findOneAndUpdate(
      { adminId, id: req.params.id },
      updateFields,
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders/:id/bill", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const order = await Order.findOneAndUpdate(
      { adminId, id: req.params.id },
      { status: "billed" },
      { new: true }
    );
    await Table.findOneAndUpdate(
      { adminId, id: order.tableId },
      { status: "bill" }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders/:id/pay", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const { paymentMethod } = req.body;
    const closedAt = new Date().toISOString();

    const order = await Order.findOneAndUpdate(
      { adminId, id: req.params.id },
      { status: "paid", closedAt, paymentMethod },
      { new: true }
    );

    const invoiceId = "inv_" + Date.now();
    const invoice = await Invoice.create({
      adminId,
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
      isTakeaway: order.isTakeaway,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
    });

    await Table.findOneAndUpdate(
      { adminId, id: order.tableId },
      { status: "paid" }
    );

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/invoices", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const invoices = await Invoice.find({ adminId }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ANALYTICS ---
app.get("/api/analytics", authenticateToken, async (req, res) => {
  try {
    const adminId = resolveAdminId(req);
    const now = new Date();
    
    // Start of today (local midnight)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    // Start of yesterday
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    
    // Today's invoices
    const todayInvoices = await Invoice.find({ adminId, createdAt: { $gte: todayStart } });
    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Yesterday's invoices
    const yesterdayInvoices = await Invoice.find({
      adminId,
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
    const activeTablesCount = await Table.countDocuments({ adminId, status: "active" });
    const billedTablesCount = await Table.countDocuments({ adminId, status: "bill" });
    const paidTablesCount = await Table.countDocuments({ adminId, status: "paid" });
    const emptyTablesCount = await Table.countDocuments({ adminId, status: "empty" });
    const openOrdersCount = await Order.countDocuments({ adminId, status: { $ne: "paid" } });

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
        adminId,
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
        adminId,
        createdAt: { $gte: startOfMonth, $lt: endOfMonth },
      });
      const monthSales = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
      monthlySales.push({
        label: monthNames[d.getMonth()],
        value: monthSales,
      });
    }

    // Ticket averages
    const allInvoices = await Invoice.find({ adminId });
    const averageTicket = allInvoices.length
      ? Math.round(allInvoices.reduce((sum, inv) => sum + inv.total, 0) / allInvoices.length)
      : 0;

    // Month Pace
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const currentMonthInvoices = await Invoice.find({ adminId, createdAt: { $gte: currentMonthStart } });
    const monthPace = currentMonthInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Latest order opened time
    const latestOrder = await Order.findOne({ adminId }).sort({ openedAt: -1 });
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

// Background job to auto-clear paid tables after 2 minutes grace period
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
        
        if (diffMins >= 2) {
          table.status = "empty";
          table.currentOrderId = null;
          await table.save();
          console.log(`Auto-cleared Table T${table.id} after 2 minutes grace period.`);
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

// Fallback route for SPA routing (must be placed after all API endpoints)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "../dist/index.html"), (err) => {
    if (err) {
      res.status(404).send("Frontend build not found. Please build the frontend first.");
    }
  });
});

// ==========================================
// 5. SERVER START
// ==========================================
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
