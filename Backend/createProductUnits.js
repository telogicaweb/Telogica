require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI);

const productSchema = new mongoose.Schema({
  name: String,
  modelNumberPrefix: String,
  warrantyPeriodMonths: Number
}, { timestamps: true });

const productUnitSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  serialNumber: { type: String, required: true, unique: true },
  modelNumber: { type: String, required: true },
  warrantyPeriodMonths: { type: Number, default: 12 },
  manufacturingDate: { type: Date },
  status: { 
    type: String, 
    enum: ['available', 'sold', 'reserved', 'defective', 'returned'], 
    default: 'available' 
  },
  stockType: { 
    type: String, 
    enum: ['online', 'offline', 'both'], 
    default: 'both' 
  },
  currentOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  soldDate: { type: Date },
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  retailerPurchaseDate: { type: Date },
  finalCustomerSaleDate: { type: Date }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
const ProductUnit = mongoose.model('ProductUnit', productUnitSchema);

// Generate serial number
function generateSerialNumber(prefix, index) {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const sequence = String(index).padStart(6, '0');
  return `${prefix}-${year}${month}-${sequence}`;
}

// Generate model number
function generateModelNumber(prefix, index) {
  const variant = String.fromCharCode(65 + (index % 2)); // A or B
  return `${prefix}-${variant}`;
}

// Generate random manufacturing date within last 6 months
function generateManufacturingDate() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000));
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
}

async function createProductUnits() {
  try {
    // Get all products
    const products = await Product.find({});
    
    if (products.length === 0) {
      console.log('❌ No products found. Please create products first.');
      process.exit(1);
    }
    
    console.log(`Found ${products.length} products. Creating 2 units for each...\n`);
    
    let totalCreated = 0;
    let totalSkipped = 0;
    
    for (const product of products) {
      const prefix = product.modelNumberPrefix || 'PROD';
      const warrantyMonths = product.warrantyPeriodMonths || 12;
      
      // Create 2 units for this product
      for (let i = 0; i < 2; i++) {
        const unitIndex = totalCreated + totalSkipped + i + 1;
        const serialNumber = generateSerialNumber(prefix, unitIndex);
        
        // Check if unit with this serial number already exists
        const existingUnit = await ProductUnit.findOne({ serialNumber });
        
        if (existingUnit) {
          totalSkipped++;
          continue;
        }
        
        const unitData = {
          product: product._id,
          serialNumber: serialNumber,
          modelNumber: generateModelNumber(prefix, i),
          warrantyPeriodMonths: warrantyMonths,
          manufacturingDate: generateManufacturingDate(),
          status: 'available',
          stockType: i === 0 ? 'online' : 'offline' // First unit online, second offline
        };
        
        await ProductUnit.create(unitData);
        totalCreated++;
      }
      
      console.log(`✅ Created 2 units for: ${product.name}`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Product Units Creation Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Products Processed: ${products.length}`);
    console.log(`✅ Units Created: ${totalCreated}`);
    console.log(`⚠️  Units Skipped: ${totalSkipped} (already exist)`);
    console.log(`📋 Units per Product: 2 (1 online, 1 offline)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating product units:', error);
    process.exit(1);
  }
}

createProductUnits();
