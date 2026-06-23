const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurantdb';

function getTableName(id) {
  if (id >= 1 && id <= 6) return `R${id}`;
  if (id >= 7 && id <= 10) return `F${id - 6}`;
  if (id >= 11 && id <= 14) return `T${id - 10}`;
  return `Table ${id}`;
}

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
  
  // Reset settings to "Hotel Paradise" and 14 tables
  await db.collection('settings').updateOne(
    { adminId },
    {
      $set: {
        restaurantName: "Hotel Paradise",
        address: "123 MG Road, Your City",
        gstNumber: "07AABC1234D1Z5",
        gstPercent: 5,
        currency: "₹",
        tableCount: 14,
        restaurantTableCount: 6,
        familyTableCount: 4,
        takeawayTableCount: 4
      }
    },
    { upsert: true }
  );
  console.log('Settings updated to Hotel Paradise with 14 tables.');

  // Clear existing orders for this admin
  await db.collection('orders').deleteMany({ adminId });
  console.log('Cleared existing orders.');

  // Clear existing tables for this admin
  await db.collection('tables').deleteMany({ adminId });
  console.log('Cleared existing tables.');

  // Create default orders to match the screenshot:
  // - Table 1: Active
  // - Table 2: Active
  // - Table 7: Active
  // - Table 11: Active (Takeaway)
  // - Table 12: Billed (Bill Ready, Takeaway)
  
  const defaultOrders = [
    {
      adminId,
      id: "ord_1",
      tableId: 1,
      orderNo: "#1025",
      guests: 4,
      status: "open",
      items: [{ menuItemId: "m42", name: "Veg Dum Biryani", price: 180, qty: 1 }],
      subtotal: 180,
      gstAmount: 9,
      total: 189,
      openedAt: new Date().toISOString(),
      isTakeaway: false
    },
    {
      adminId,
      id: "ord_2",
      tableId: 2,
      orderNo: "#1024",
      guests: 4,
      status: "open",
      items: [{ menuItemId: "m43", name: "Egg Dum Biryani", price: 200, qty: 1 }],
      subtotal: 200,
      gstAmount: 10,
      total: 210,
      openedAt: new Date().toISOString(),
      isTakeaway: false
    },
    {
      adminId,
      id: "ord_7",
      tableId: 7,
      orderNo: "#1022",
      guests: 4,
      status: "open",
      items: [{ menuItemId: "m42", name: "Veg Dum Biryani", price: 180, qty: 1 }],
      subtotal: 180,
      gstAmount: 9,
      total: 189,
      openedAt: new Date().toISOString(),
      isTakeaway: false
    },
    {
      adminId,
      id: "ord_11",
      tableId: 11,
      orderNo: "#1021",
      guests: 1,
      status: "open",
      items: [{ menuItemId: "m45", name: "Paneer Kalimiri Kabab", price: 180, qty: 1 }],
      subtotal: 180,
      gstAmount: 9,
      total: 189,
      openedAt: new Date().toISOString(),
      isTakeaway: true,
      customerName: "John Doe",
      customerPhone: "9876543210"
    },
    {
      adminId,
      id: "ord_12",
      tableId: 12,
      orderNo: "#1023",
      guests: 1,
      status: "billed",
      items: [
        { menuItemId: "m44", name: "Paneer Tikka Biryani", price: 220, qty: 1 }
      ],
      subtotal: 220,
      gstAmount: 11,
      total: 231,
      openedAt: new Date().toISOString(),
      isTakeaway: true,
      customerName: "Jane Smith",
      customerPhone: "9876543211"
    }
  ];

  await db.collection('orders').insertMany(defaultOrders);
  console.log('Seeded default orders.');

  // Create tables T1 to T14
  // - T1, T2, T7, T11: active
  // - T12: bill (Bill Ready)
  // - T14: paid
  // - Others: empty
  const tablesToSeed = [];
  for (let i = 1; i <= 14; i++) {
    let status = "empty";
    let currentOrderId = null;

    if (i === 1) { status = "active"; currentOrderId = "ord_1"; }
    else if (i === 2) { status = "active"; currentOrderId = "ord_2"; }
    else if (i === 7) { status = "active"; currentOrderId = "ord_7"; }
    else if (i === 11) { status = "active"; currentOrderId = "ord_11"; }
    else if (i === 12) { status = "bill"; currentOrderId = "ord_12"; }
    else if (i === 14) { status = "paid"; }

    tablesToSeed.push({
      adminId,
      id: i,
      name: getTableName(i),
      seats: 4,
      status,
      currentOrderId
    });
  }

  await db.collection('tables').insertMany(tablesToSeed);
  console.log('Seeded 14 tables with R1-R6, F1-F4, T1-T4 names.');

  console.log('\nMigration complete!');
  process.exit(0);
}).catch(e => { console.error('Error:', e); process.exit(1); });
