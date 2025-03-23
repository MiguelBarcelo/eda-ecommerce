const express = require("express");
const mongoose = require("mongoose");
const { Kafka } = require("kafkajs");
require("dotenv").config();
// Models
const Order = require("/app/shared/models/Order");
const Status = require("/app/shared/constants/status");

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// Kafka Consumer & Producer Setup
const kafka = new Kafka({
  clientId: process.env.PYMNTSRV_CLIENT_ID,
  brokers: [process.env.KAFKA_BROKER],
});
const consumer = kafka.consumer({
  groupId: process.env.PYMNTSRV_GROUP_ID,
});
const producer = kafka.producer();

// Payment Schema
const Payment = mongoose.model(
  "Paymnet",
  new mongoose.Schema({
    orderId: String,
    userId: String,
    amount: Number,
    status: {
      type: String,
      default: "pending",
    },
  })
);

// Simulated payment processing function
async function processPayment(order) {
  console.log("💳 Processing payment for order:", order.orderId);

  // Simulate payment success
  const isPaid = Math.random() > 0.1; // 90% success rate
  const status = isPaid
    ? Status.Order.paymentConfirmed
    : Status.Order.paymentFailed;

  // Update Order Status
  await Order.findByIdAndUpdate(order.orderId, { status });

  // Ensure producer is ready before sending
  await producer.connect();
  // Publish event to Kafka
  await producer.send({
    topic: process.env.TOPIC_ORDER_UPDATES,
    messages: [{ value: JSON.stringify({ ...order, status }) }],
  });

  console.log(`💰 Order ${order.orderId} status updated to: ${status}`);
}

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: process.env.TOPIC_ORDER_UPDATES,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const orderUpdate = JSON.parse(message.value.toString());

      // Process payment only if inventory is available
      if (orderUpdate.status === Status.Order.inventoryConfirmed) {
        await processPayment(orderUpdate);
      }
    },
  });
}

startConsumer().catch(console.error);

app.listen(process.env.PYMNTSRV_PORT, () =>
  console.log(`Payment Service running on port ${process.env.PYMNTSRV_PORT}`)
);
