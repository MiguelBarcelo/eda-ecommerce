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
  clientId: process.env.PYMNTSRV_CLIENT_ID,
  brokers: [process.env.KAFKA_BROKER],
});
const consumer = kafka.consumer({
  groupId: process.env.PYMNTSRV_GROUP_ID,
});
const producer = kafka.producer();
producer.connect();

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
async function processPayment({ orderId, userId, amount, success }) {
  if (!success) {
    console.log(`Payment failed for order ${orderId} (Out of stock)`);
    return;
  }

  // Simulate payment success
  const payment = await Payment.create({
    orderId,
    userId,
    amount,
    status: "completed",
  });

  // Publish payment event
  await producer.send({
    topic: process.env.TOPIC_PAYMENT_PROCESSED,
    messages: [{ value: JSON.stringify({ orderId, success: true }) }],
  });

  console.log(`Payment processed successfully for order ${orderId}`);
}

// Kafka Consumer: Listen for 'inventory_updated' events
async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: process.env.TOPIC_INVENTORY_UPDATED,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      console.log(`Received inventory update for order ${event.orderId}`);

      // Process payment only if inventory is available
      await processPayment({
        orderId: event.orderId,
        userId: "user123",
        amount: 99.99,
        success: event.success,
      });
    },
  });
}

startConsumer();

app.listen(process.env.PYMNTSRV_PORT, () =>
  console.log(`Payment Service running on port ${process.env.PYMNTSRV_PORT}`)
);
