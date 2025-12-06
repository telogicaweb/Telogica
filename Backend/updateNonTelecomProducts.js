const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

// Database connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

async function updateNonTelecomProducts() {
  try {
    console.log('Starting to update non-Telecommunication products...');
    
    // Update all products that are NOT Telecommunication category
    const result = await Product.updateMany(
      { category: { $ne: 'Telecommunication' } },
      { 
        $set: { 
          requiresQuote: true,
          isTelecom: false
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} non-Telecommunication products`);
    console.log('   - Set requiresQuote: true');
    console.log('   - Set isTelecom: false');
    
    // Verify the update
    const nonTelecomProducts = await Product.find({ 
      category: { $ne: 'Telecommunication' } 
    }).select('name category requiresQuote isTelecom');
    
    console.log('\nVerification - Non-Telecommunication Products:');
    const categories = {};
    nonTelecomProducts.forEach((product) => {
      if (!categories[product.category]) {
        categories[product.category] = [];
      }
      categories[product.category].push(product);
    });

    Object.keys(categories).forEach(category => {
      console.log(`\n${category} (${categories[category].length} products):`);
      categories[category].forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name}`);
        console.log(`     requiresQuote: ${product.requiresQuote}, isTelecom: ${product.isTelecom}`);
      });
    });

    console.log('\n✅ All non-Telecommunication products updated successfully!');
    console.log('\nRules:');
    console.log('- Telecommunication products: Can buy 1-2 directly at original price');
    console.log('- Telecommunication products: 3+ requires quote for bulk discount');
    console.log('- Defense products: MUST request quote (no direct purchase)');
    console.log('- Railway products: MUST request quote (no direct purchase)');
    console.log('- All other products: MUST request quote (no direct purchase)');
    
  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateNonTelecomProducts();
