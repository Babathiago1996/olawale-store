require('dotenv').config();
const mongoose = require('mongoose');

const Item = require('./models/item'); // adjust path if needed

async function fixStock() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Mongo connected');

    const items = await Item.find();

    console.log(`🔧 Fixing ${items.length} items...\n`);

    for (const item of items) {
      item.markModified('stockQuantity');
      await item.save();

      console.log(`✔ Fixed: ${item.name}`);
    }

    console.log('\n🎉 All stock statuses recalculated!');
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixStock();
