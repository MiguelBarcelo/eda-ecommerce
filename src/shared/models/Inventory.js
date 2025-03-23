const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  productId: String,
  quantity: Number,
});

const Inventory = mongoose.model("Inventory", inventorySchema);
module.exports = Inventory;
