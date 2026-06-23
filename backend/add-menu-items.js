/**
 * One-time script: migrates legacy Cafe/Restaurant top-level categories
 * into section-based sub-categories.
 * Run with: node backend/add-menu-items.js
 */
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/restaurantdb";

const CategorySchema = new mongoose.Schema({
  adminId: String, id: String, name: String, icon: String, sortOrder: Number, section: String,
});
CategorySchema.index({ adminId: 1, id: 1 }, { unique: true });
const Category = mongoose.model("Category", CategorySchema);

const MenuItemSchema = new mongoose.Schema({
  adminId: String, id: String, categoryId: String,
  name: String, price: Number, emoji: String,
  isAvailable: Boolean, isVeg: Boolean,
});
MenuItemSchema.index({ adminId: 1, id: 1 }, { unique: true });
const MenuItem = mongoose.model("MenuItem", MenuItemSchema);

const UserSchema = new mongoose.Schema({ email: String, role: String });
const User = mongoose.model("User", UserSchema);

const SECTION_BY_CATEGORY = {
  popular: "restaurant",
  main: "restaurant",
  rice: "restaurant",
  beverages: "cafe",
  snacks: "cafe",
  desserts: "cafe",
};

const REQUIRED_CATEGORIES = [
  { id: "popular", name: "Popular", icon: "★", sortOrder: 0, section: "restaurant" },
  { id: "main", name: "Main Course", icon: "🍛", sortOrder: 1, section: "restaurant" },
  { id: "rice", name: "Rice", icon: "🍚", sortOrder: 2, section: "restaurant" },
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

function usesSuffixedIds(categories, adminId) {
  return categories.some((category) => category.id.endsWith(`_${adminId}`));
}

function scopedId(baseId, adminId, isSuffixed) {
  return isSuffixed ? `${baseId}_${adminId}` : baseId;
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const adminUsers = await User.find({ role: "admin" });
  if (adminUsers.length === 0) { console.error("No admin users found!"); process.exit(1); }

  for (const adminUser of adminUsers) {
    const adminId = adminUser._id.toString();
    console.log("\nUsing adminId:", adminId);

    const categories = await Category.find({ adminId });
    const isSuffixed = usesSuffixedIds(categories, adminId);
    const requiredMenuIds = REQUIRED_MENU_ITEMS.map((itemData) => scopedId(itemData.id, adminId, isSuffixed));

    for (const categoryData of REQUIRED_CATEGORIES) {
      const id = scopedId(categoryData.id, adminId, isSuffixed);
      const category = await Category.findOneAndUpdate(
        { adminId, id },
        { ...categoryData, id, adminId },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Ensured ${category.section} category: ${category.name}`);
    }

    const refreshedCategories = await Category.find({ adminId });
    for (const category of refreshedCategories) {
      const baseId = category.id.replace(`_${adminId}`, "");
      const section = SECTION_BY_CATEGORY[baseId];
      if (section && category.section !== section) {
        category.section = section;
        await category.save();
        console.log(`✅ Updated section for ${category.name} -> ${section}`);
      }
    }

    const legacyCategories = await Category.find({ adminId, id: { $in: ["cafe", "restaurant"] } });
    for (const category of legacyCategories) {
      await Category.deleteOne({ _id: category._id });
      console.log(`🗑️ Removed legacy category: ${category.name}`);
    }

    const deleteResult = await MenuItem.deleteMany({ adminId, id: { $nin: requiredMenuIds } });
    console.log(`🗑️ Removed ${deleteResult.deletedCount} old menu items`);

    for (const itemData of REQUIRED_MENU_ITEMS) {
      const id = scopedId(itemData.id, adminId, isSuffixed);
      const categoryId = scopedId(itemData.categoryId, adminId, isSuffixed);
      const item = await MenuItem.findOneAndUpdate(
        { adminId, id },
        { ...itemData, id, categoryId, adminId },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Ensured menu item: ${item.name} -> ${categoryId}`);
    }
  }

  console.log("\n🎉 Migration complete.");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
