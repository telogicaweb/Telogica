require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI);

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  warrantyPeriodMonths: Number,
  extendedWarrantyAvailable: Boolean,
  extendedWarrantyMonths: Number,
  extendedWarrantyPrice: Number
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

async function updateProductsWarranty() {
  try {
    // Update all products to enable extended warranty with a default price
    const result = await Product.updateMany(
      {},
      {
        $set: {
          warrantyPeriodMonths: 12, // 1 year standard warranty
          extendedWarrantyAvailable: true,
          extendedWarrantyMonths: 24, // 2 years extended warranty
        }
      }
    );

    // Set extended warranty price based on product price (5% of product price or minimum 500)
    const products = await Product.find({});
    
    for (const product of products) {
      if (product.price) {
        const warrantyPrice = Math.max(Math.round(product.price * 0.05), 500);
        await Product.findByIdAndUpdate(product._id, {
          $set: { extendedWarrantyPrice: warrantyPrice }
        });
      } else {
        // For products without price (quote required), set a default warranty price
        await Product.findByIdAndUpdate(product._id, {
          $set: { extendedWarrantyPrice: 5000 }
        });
      }
    }

    console.log('✅ Updated all products with warranty options');
    console.log(`📊 Total products updated: ${result.modifiedCount}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Warranty Configuration:');
    console.log('• Standard Warranty: 12 months (Free)');
    console.log('• Extended Warranty: 24 months (Admin can modify price)');
    console.log('• Extended Warranty Price: 5% of product price or ₹500 minimum');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating products:', error);
    process.exit(1);
  }
}

updateProductsWarranty();
