const mongoose = require("mongoose");
const Status = require("../constants/status");

const itemSchema = new mongoose.Schema(
  {
    productId: String,
    quantity: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  userId: String,
  items: [itemSchema],
  totalPrice: Number,
  status: {
    type: String,
    default: Status.Order.pending,
  },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
