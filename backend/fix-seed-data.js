/**
 * One-time migration: Add adminId to existing seed data records
 * that were created before multi-tenancy was implemented.
 */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurantdb';

mongoose.connect(MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  console.log('Connected to MongoDB');
  
  // Find admin@restaurant.com user
  const adminUser = await db.collection('users').findOne({ email: 'admin@restaurant.com' });
  if (!adminUser) {
    console.error('Default admin user not found!');
    process.exit(1);
  }
  const adminId = adminUser._id.toString();
  console.log('Default admin ID:', adminId);
  
  // Fix tables
  const tableResult = await db.collection('tables').updateMany(
    { adminId: { $exists: false } },
    { $set: { adminId: adminId } }
  );
  console.log('Tables fixed:', tableResult.modifiedCount);
  
  // Fix orders
  const orderResult = await db.collection('orders').updateMany(
    { adminId: { $exists: false } },
    { $set: { adminId: adminId } }
  );
  console.log('Orders fixed:', orderResult.modifiedCount);
  
  // Fix invoices
  const invoiceResult = await db.collection('invoices').updateMany(
    { adminId: { $exists: false } },
    { $set: { adminId: adminId } }
  );
  console.log('Invoices fixed:', invoiceResult.modifiedCount);
  
  // Fix categories
  const catResult = await db.collection('categories').updateMany(
    { adminId: { $exists: false } },
    { $set: { adminId: adminId } }
  );
  console.log('Categories fixed:', catResult.modifiedCount);
  
  // Fix menu items
  const menuResult = await db.collection('menuitems').updateMany(
    { adminId: { $exists: false } },
    { $set: { adminId: adminId } }
  );
  console.log('Menu items fixed:', menuResult.modifiedCount);
  
  console.log('\nMigration complete!');
  process.exit(0);
}).catch(e => { console.error('Error:', e); process.exit(1); });
