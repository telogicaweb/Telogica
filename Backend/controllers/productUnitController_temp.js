// Delete product unit (Admin)
exports.deleteProductUnit = async (req, res) => {
  try {
    const { id } = req.params;

    const unit = await ProductUnit.findByIdAndDelete(id);

    if (!unit) {
      return res.status(404).json({ message: 'Product unit not found' });
    }

    await recalculateProductInventory(unit.product);

    res.json({ message: 'Product unit removed' });
  } catch (error) {
    console.error('Error deleting product unit:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
