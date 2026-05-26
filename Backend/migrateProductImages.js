const mongoose = require('mongoose');
const Product = require('./models/Product');
const cloudinary = require('./utils/cloudinary');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 60000 })
  .then(() => console.log('MongoDB connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

async function uploadBase64ToCloudinary(base64String, productId, index) {
  const result = await cloudinary.uploader.upload(base64String, {
    folder: 'products',
    resource_type: 'image',
    public_id: `product_${productId}_${index}`,
    overwrite: true,
  });
  return result.secure_url;
}

async function migrateProductImages() {
  try {
    // Find only products that still have at least one base64 image
    const products = await Product.find({
      images: { $elemMatch: { $regex: '^data:' } },
    }).select('_id name images');

    console.log(`Found ${products.length} products with base64 images to migrate`);

    let success = 0;
    let failed = 0;

    for (const product of products) {
      const migratedImages = [];
      let changed = false;

      for (let i = 0; i < product.images.length; i++) {
        const img = product.images[i];
        if (img && img.startsWith('data:')) {
          try {
            const url = await uploadBase64ToCloudinary(img, product._id, i);
            migratedImages.push(url);
            changed = true;
            console.log(`  ✓ [${product.name}] image ${i} → ${url}`);
          } catch (err) {
            console.error(`  ✗ [${product.name}] image ${i} failed: ${err.message}`);
            // Keep the base64 so it isn't lost; migration can be re-run
            migratedImages.push(img);
          }
        } else {
          migratedImages.push(img);
        }
      }

      if (changed) {
        await Product.updateOne({ _id: product._id }, { $set: { images: migratedImages } });
        success++;
        console.log(`Saved ${product.name}`);
      }
    }

    console.log(`\nMigration complete — ${success} products updated, ${failed} products skipped`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

migrateProductImages();
