const express = require("express");
const mongoose = require("mongoose");
const { Kafka } = require("kafkajs");
require("dotenv").config();
// Models
const Order = require("../../shared/models/Order");
const Inventory = require("../../shared/models/Inventory");
const Status = require("../../shared/constants/status");

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// Kafka Consumer & Producer Setup
const kafka = new Kafka({
  clientId: process.env.INVSRV_CLIENT_ID,
  brokers: [process.env.KAFKA_BROKER],
});
const consumer = kafka.consumer({ groupId: process.env.INVSRV_GROUP_ID });
const producer = kafka.producer();
producer.connect();

// Function to process orders
async function processOrder(order) {
  console.log(`🔄 Checking inventory for order: ${order._id}`);

  let itemsAvailable = true;
  let status = Status.Order.inventoryConfirmed;

  for (let item of order.items) {
    const product = await Inventory.findOne({ productId: item.productId });

    if (!product || product.quantity < item.quantity) {
      itemsAvailable = false;
      status = Status.Order.outOfStock;
      break;
    }
  }

  if (itemsAvailable) {
    for (let item of order.items) {
      await Inventory.updateOne(
        { productId: item.productId },
        { $inc: { quantity: -item.quantity } }
      );
    }
  }

  await Order.findByIdAndUpdate(order._id, { status });

  // Publish inventory update event
  await producer.send({
    topic: process.env.TOPIC_ORDER_UPDATES,
    messages: [
      {
        value: JSON.stringify({ orderId: order._id, status }),
      },
    ],
  });

  console.log(`📦 Order ${order._id} status updated to: ${status}`);
}

// Kafka Consumer: Listen for 'order_placed' events
async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: process.env.TOPIC_ORDER_PLACED,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const order = JSON.parse(message.value.toString());
      console.log(`Received order: ${order._id}`);
      await processOrder(order);
    },
  });
}

startConsumer().catch(console.error);

app.listen(process.env.INVSRV_PORT, () =>
  console.log(`📦 Inventory Service running on port ${process.env.INVSRV_PORT}`)
);
