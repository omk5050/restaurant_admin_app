const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateToken, requireRole } = require("./authenticationmiddleware");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_restaurant_key_123";

// Helper to get User model dynamically to avoid early registration issues
const getUserModel = () => mongoose.model("User");

// ==========================================
// 1. PUBLIC AUTH ROUTES
// ==========================================

/**
 * Login endpoint for Admin and Super Admin users.
 */
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const User = getUserModel();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. SUPER-ADMIN ONLY: ADMIN MANAGEMENT ROUTES
// ==========================================

/**
 * Get all admin users.
 */
router.get("/super-admin/admins", authenticateToken, requireRole("super-admin"), async (req, res) => {
  try {
    const User = getUserModel();
    const admins = await User.find({ role: "admin" }).select("-password").sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Create a new admin user.
 */
router.post("/super-admin/admins", authenticateToken, requireRole("super-admin"), async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required." });
    }

    const User = getUserModel();
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: "A user with this email already exists." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin",
      name,
    });

    const userResponse = newAdmin.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update an admin user (name, email, and/or password).
 */
router.put("/super-admin/admins/:id", authenticateToken, requireRole("super-admin"), async (req, res) => {
  try {
    const { email, name, password } = req.body;
    const User = getUserModel();

    const user = await User.findById(req.params.id);
    if (!user || user.role !== "admin") {
      return res.status(404).json({ error: "Admin user not found." });
    }

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== user.email) {
        // Ensure email isn't taken
        const emailExists = await User.findOne({ email: normalizedEmail });
        if (emailExists) {
          return res.status(400).json({ error: "This email is already in use." });
        }
        user.email = normalizedEmail;
      }
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Delete an admin user.
 */
router.delete("/super-admin/admins/:id", authenticateToken, requireRole("super-admin"), async (req, res) => {
  try {
    const User = getUserModel();
    const user = await User.findById(req.params.id);

    if (!user || user.role !== "admin") {
      return res.status(404).json({ error: "Admin user not found." });
    }

    await User.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: "Admin user deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
