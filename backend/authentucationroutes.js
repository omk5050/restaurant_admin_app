const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const authenticateToken = require("./authenticationmiddleware");

const router = express.Router();
const User = mongoose.model("User");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Please provide email, password and role." });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Check role: allow super-admin to bypass requested role constraint (so they can login through the admin login page)
    if (user.role !== "super-admin" && user.role !== role) {
      return res.status(401).json({ error: "Unauthorized access for this role." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        email: user.email,
        role: user.role,
        name: user.name
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// GET /admins - list all registered admins (Super Admin only)
router.get("/admins", authenticateToken, async (req, res) => {
  if (req.user.role !== "super-admin") {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    const Settings = mongoose.model("Settings");
    const admins = await User.find({ role: "admin" }).select("-password");
    
    const adminsWithRestaurants = await Promise.all(
      admins.map(async (admin) => {
        const settings = await Settings.findOne({ adminId: admin._id.toString() });
        return {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          createdAt: admin.createdAt,
          restaurantName: settings ? settings.restaurantName : "Not Configured",
        };
      })
    );
    res.json(adminsWithRestaurants);
  } catch (err) {
    console.error("Fetch admins error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// POST /register-admin - register new admin and default-seed their restaurant (Super Admin only)
router.post("/register-admin", authenticateToken, async (req, res) => {
  if (req.user.role !== "super-admin") {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    const { name, email, password, restaurantName } = req.body;
    if (!name || !email || !password || !restaurantName) {
      return res.status(400).json({ error: "Please provide name, email, password and restaurant name." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "Email already exists." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      createdAt: new Date().toISOString(),
    });

    const Settings = mongoose.model("Settings");
    const Category = mongoose.model("Category");
    const MenuItem = mongoose.model("MenuItem");
    const Table = mongoose.model("Table");

    // Create Settings
    await Settings.create({
      adminId: newAdmin._id,
      restaurantName,
      address: "123 MG Road, Your City",
      gstNumber: "07AABC1234D1Z5",
      gstPercent: 5,
      currency: "₹",
      tableCount: 12,
    });

    // Seed Categories
    const defaultCategories = [
      { id: "popular_" + newAdmin._id, name: "Popular", icon: "★", sortOrder: 0, section: "restaurant", adminId: newAdmin._id },
      { id: "main_" + newAdmin._id, name: "Main Course", icon: "🍛", sortOrder: 1, section: "restaurant", adminId: newAdmin._id },
      { id: "rice_" + newAdmin._id, name: "Rice", icon: "🍚", sortOrder: 2, section: "restaurant", adminId: newAdmin._id },
      { id: "beverages_" + newAdmin._id, name: "Beverages", icon: "🥤", sortOrder: 0, section: "cafe", adminId: newAdmin._id },
      { id: "snacks_" + newAdmin._id, name: "Snacks", icon: "🍟", sortOrder: 1, section: "cafe", adminId: newAdmin._id },
      { id: "desserts_" + newAdmin._id, name: "Desserts", icon: "🍰", sortOrder: 2, section: "cafe", adminId: newAdmin._id },
    ];
    await Category.insertMany(defaultCategories);

    // Seed Menu Items
    const defaultMenu = [
      { id: "m38_" + newAdmin._id, categoryId: "desserts_" + newAdmin._id, name: "Tripple Choco Bowl", price: 150, emoji: "🍫", isAvailable: true, isVeg: true, adminId: newAdmin._id },
      { id: "m39_" + newAdmin._id, categoryId: "desserts_" + newAdmin._id, name: "Oreo Choco Bowl", price: 160, emoji: "🍪", isAvailable: true, isVeg: true, adminId: newAdmin._id },
      { id: "m40_" + newAdmin._id, categoryId: "snacks_" + newAdmin._id, name: "French Fries Classic", price: 80, emoji: "🍟", isAvailable: true, isVeg: true, adminId: newAdmin._id },
      { id: "m41_" + newAdmin._id, categoryId: "snacks_" + newAdmin._id, name: "Peri Peri French Fries", price: 100, emoji: "🌶️", isAvailable: true, isVeg: true, adminId: newAdmin._id },
      { id: "m42_" + newAdmin._id, categoryId: "rice_" + newAdmin._id, name: "Veg Dum Biryani", price: 180, emoji: "🍛", isAvailable: true, isVeg: true, adminId: newAdmin._id },
      { id: "m43_" + newAdmin._id, categoryId: "rice_" + newAdmin._id, name: "Egg Dum Biryani", price: 200, emoji: "🍳", isAvailable: true, isVeg: false, adminId: newAdmin._id },
      { id: "m44_" + newAdmin._id, categoryId: "rice_" + newAdmin._id, name: "Paneer Tikka Biryani", price: 220, emoji: "🍢", isAvailable: true, isVeg: true, adminId: newAdmin._id },
      { id: "m45_" + newAdmin._id, categoryId: "main_" + newAdmin._id, name: "Paneer Kalimiri Kabab", price: 180, emoji: "🫕", isAvailable: true, isVeg: true, adminId: newAdmin._id },
    ];
    await MenuItem.insertMany(defaultMenu);

    // Seed Tables
    const defaultTables = Array.from({ length: 12 }, (_, index) => {
      const id = index + 1;
      return {
        id,
        name: `T${id}`,
        seats: 4,
        status: "empty",
        currentOrderId: null,
        adminId: newAdmin._id,
      };
    });
    await Table.insertMany(defaultTables);

    res.json({
      success: true,
      admin: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        restaurantName
      }
    });

  } catch (err) {
    console.error("Register admin error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- SIGNUP / REGISTRATION REQUEST ---
router.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password, restaurantName } = req.body;
    if (!name || !email || !phone || !password || !restaurantName) {
      return res.status(400).json({ error: "All fields are mandatory." });
    }

    const User = mongoose.model("User");
    const RegistrationRequest = mongoose.model("RegistrationRequest");

    // Check if email already registered as user
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "Email is already registered as an admin." });
    }

    // Check if pending request already exists
    const requestExists = await RegistrationRequest.findOne({ email, status: "pending" });
    if (requestExists) {
      return res.status(400).json({ error: "A registration request for this email is already pending approval." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Upsert or create request (reset to pending if previously rejected/approved)
    await RegistrationRequest.findOneAndUpdate(
      { email },
      {
        name,
        phone,
        password: hashedPassword,
        restaurantName,
        status: "pending",
        createdAt: new Date().toISOString()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: "Registration request submitted successfully." });
  } catch (err) {
    console.error("Signup request error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- GET REGISTRATION REQUESTS (Super Admin only) ---
router.get("/registration-requests", authenticateToken, async (req, res) => {
  if (req.user.role !== "super-admin") {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    const RegistrationRequest = mongoose.model("RegistrationRequest");
    const requests = await RegistrationRequest.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("Fetch requests error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- DECIDE REGISTRATION REQUEST (Super Admin only) ---
router.post("/registration-requests/:id/action", authenticateToken, async (req, res) => {
  if (req.user.role !== "super-admin") {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    const { action } = req.body;
    if (action !== "approve" && action !== "reject") {
      return res.status(400).json({ error: "Invalid action. Must be approve or reject." });
    }

    const RegistrationRequest = mongoose.model("RegistrationRequest");
    const request = await RegistrationRequest.findById(req.params.id);

    if (!request || request.status !== "pending") {
      return res.status(404).json({ error: "Pending registration request not found." });
    }

    if (action === "reject") {
      request.status = "rejected";
      await request.save();
      return res.json({ success: true, message: "Registration request rejected." });
    }

    // Approve: Create admin user and seed restaurant data
    const User = mongoose.model("User");
    const userExists = await User.findOne({ email: request.email });
    if (userExists) {
      request.status = "approved"; // Set request to approved since user exists
      await request.save();
      return res.status(400).json({ error: "This email is already registered." });
    }

    const newAdmin = await User.create({
      name: request.name,
      email: request.email,
      password: request.password, // Pre-hashed password
      role: "admin",
      createdAt: new Date().toISOString(),
    });

    const Settings = mongoose.model("Settings");
    const Category = mongoose.model("Category");
    const MenuItem = mongoose.model("MenuItem");
    const Table = mongoose.model("Table");

    // Create Settings
    await Settings.create({
      adminId: newAdmin._id,
      restaurantName: request.restaurantName,
      address: "123 MG Road, Your City",
      gstNumber: "07AABC1234D1Z5",
      gstPercent: 5,
      currency: "₹",
      tableCount: 12,
    });

    // Seed Categories
    const defaultCategories = [
      { id: "popular_" + newAdmin._id, name: "Popular", icon: "★", sortOrder: 0, section: "restaurant", adminId: newAdmin._id },
      { id: "main_" + newAdmin._id, name: "Main Course", icon: "🍛", sortOrder: 1, section: "restaurant", adminId: newAdmin._id },
      { id: "rice_" + newAdmin._id, name: "Rice", icon: "🍚", sortOrder: 2, section: "restaurant", adminId: newAdmin._id },
      { id: "beverages_" + newAdmin._id, name: "Beverages", icon: "🥤", sortOrder: 0, section: "cafe", adminId: newAdmin._id },
      { id: "snacks_" + newAdmin._id, name: "Snacks", icon: "🍟", sortOrder: 1, section: "cafe", adminId: newAdmin._id },
      { id: "desserts_" + newAdmin._id, name: "Desserts", icon: "🍰", sortOrder: 2, section: "cafe", adminId: newAdmin._id },
    ];
    await Category.insertMany(defaultCategories);

    // Seed Menu Items
    const defaultMenu = [
      { id: "m38_" + newAdmin._id, categoryId: "desserts_" + newAdmin._id, name: "Tripple Choco Bowl", price: 150, emoji: "🍫", isAvailable: true, isVeg: true, adminId: newAdmin._id },
      { id: "m39_" + newAdmin._id, categoryId: "desserts_" + newAdmin._id, name: "Oreo Choco Bowl", price: 160, emoji: "🍪", isAvailable: true, isVeg: true, adminId: newAdmin._id },
      { id: "m40_" + newAdmin._id, categoryId: "snacks_" + newAdmin._id, name: "French Fries Classic", price: 80, emoji: "🍟", isAvailable: true, isVeg: true, adminId: newAdmin._id },
      { id: "m41_" + newAdmin._id, categoryId: "snacks_" + newAdmin._id, name: "Peri Peri French Fries", price: 100, emoji: "🌶️", isAvailable: true, isVeg: true, adminId: newAdmin._id },
      { id: "m42_" + newAdmin._id, categoryId: "rice_" + newAdmin._id, name: "Veg Dum Biryani", price: 180, emoji: "🍛", isAvailable: true, isVeg: true, adminId: newAdmin._id },
      { id: "m43_" + newAdmin._id, categoryId: "rice_" + newAdmin._id, name: "Egg Dum Biryani", price: 200, emoji: "🍳", isAvailable: true, isVeg: false, adminId: newAdmin._id },
      { id: "m44_" + newAdmin._id, categoryId: "rice_" + newAdmin._id, name: "Paneer Tikka Biryani", price: 220, emoji: "🍢", isAvailable: true, isVeg: true, adminId: newAdmin._id },
      { id: "m45_" + newAdmin._id, categoryId: "main_" + newAdmin._id, name: "Paneer Kalimiri Kabab", price: 180, emoji: "🫕", isAvailable: true, isVeg: true, adminId: newAdmin._id },
    ];
    await MenuItem.insertMany(defaultMenu);

    // Seed Tables
    const defaultTables = Array.from({ length: 12 }, (_, index) => {
      const id = index + 1;
      return {
        id,
        name: `T${id}`,
        seats: 4,
        status: "empty",
        currentOrderId: null,
        adminId: newAdmin._id,
      };
    });
    await Table.insertMany(defaultTables);

    request.status = "approved";
    await request.save();

    res.json({ success: true, message: "Registration request approved and admin account created." });

  } catch (err) {
    console.error("Action request error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
