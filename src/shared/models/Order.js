const mongoose = require("mongoose");
const Status = require("../constants/status");

const orderSchema = new mongoose.Schema({
  userId: String,
  items: [{ productId: String, quantity: Number }],
  totalPrice: Number,
  status: {
    type: String,
    default: Status.Order.pending,
  },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
