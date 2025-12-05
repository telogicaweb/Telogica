const Product = require('../models/Product');
const ProductUnit = require('../models/ProductUnit');

/**
 * Recalculate and persist stock counts for a given product based on available product units.
 * @param {string|import('mongoose').Types.ObjectId} productId
 * @returns {Promise<{ totalStock: number, offlineStock: number }>}
 */
async function recalculateProductInventory(productId) {
  if (!productId) {
    return { totalStock: 0, offlineStock: 0 };
  }

  const productObjectId = typeof productId === 'string' ? productId : productId.toString();

  const [totalStock, offlineStock] = await Promise.all([
    ProductUnit.countDocuments({ product: productObjectId, status: 'available' }),
    ProductUnit.countDocuments({
      product: productObjectId,
      status: 'available',
      stockType: { $in: ['offline', 'both'] }
    })
  ]);

  await Product.findByIdAndUpdate(
    productObjectId,
    { stock: totalStock, offlineStock },
    { new: false }
  );

  return { totalStock, offlineStock };
}

module.exports = { recalculateProductInventory };
