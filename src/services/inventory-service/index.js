const express = require("express");
const mongoose = require("mongoose");
const { Kafka } = require("kafkajs");
require("dotenv").config();

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

// Inventory Schema
const Inventory = mongoose.model(
  "Inventory",
  new mongoose.Schema({
    productId: String,
    quantity: Number,
  })
);

// Function to process orders
async function processOrder(order) {
  let itemsAvailable = true;

  for (let item of order.items) {
    const product = await Inventory.findOne({ productId: item.productId });

    if (!product || product.quantity < item.quantity) {
      itemsAvailable = false;
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

  // Publish inventory update event
  await producer.send({
    topic: process.env.TOPIC_INVENTORY_UPDATED,
    messages: [
      {
        value: JSON.stringify({ orderId: order._id, success: itemsAvailable }),
      },
    ],
  });

  console.log(
    `Inventory processed for order ${order._id}: ${
      itemsAvailable ? "Success" : "Failed"
    }`
  );
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

startConsumer();

app.listen(process.env.INVSRV_PORT, () =>
  console.log(`Inventory Service running on port ${process.env.INVSRV_PORT}`)
);
