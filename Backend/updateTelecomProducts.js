const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

// Database connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

async function updateTelecomProducts() {
  try {
    console.log('Starting to update Telecommunication products...');
    
    // Update all Telecommunication products
    const result = await Product.updateMany(
      { category: 'Telecommunication' },
      { 
        $set: { 
          isTelecom: true,
          maxDirectPurchaseQty: 2  // Can buy max 2 directly, 3+ requires quote
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} Telecommunication products`);
    console.log('   - Set isTelecom: true');
    console.log('   - Set maxDirectPurchaseQty: 2 (3+ requires quote)');
    
    // Verify the update
    const telecomProducts = await Product.find({ category: 'Telecommunication' }).select('name isTelecom maxDirectPurchaseQty');
    console.log('\nVerification - Telecommunication Products:');
    telecomProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   isTelecom: ${product.isTelecom}, maxDirectPurchaseQty: ${product.maxDirectPurchaseQty}`);
    });

    console.log('\n✅ All Telecommunication products updated successfully!');
    console.log('\nRules:');
    console.log('- Users can buy 1-2 Telecommunication products directly at original price');
    console.log('- Users must request quote for 3 or more Telecommunication products');
    
  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateTelecomProducts();
