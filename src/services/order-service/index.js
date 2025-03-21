const express = require("express");
const mongoose = require("mongoose");
const { Kafka } = require("kafkajs");
require("dotenv").config();

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// Kafka Producer Setup
const kafka = new Kafka({
  clientId: process.env.ORDSRV_CLIENT_ID,
  brokers: [process.env.KAFKA_BROKER],
});
const producer = kafka.producer();
producer.connect();

// Order Schema
const Order = mongoose.model(
  "Order",
  new mongoose.Schema({
    userId: String,
    items: Array,
    total: Number,
    status: {
      type: String,
      default: "pending",
    },
  })
);

// Place Order API
app.post("/order", async (req, res) => {
  const order = await Order.create(req.body);

  // Publish Event
  await producer.send({
    topic: process.env.TOPIC_ORDER_PLACED,
    messages: [{ value: JSON.stringify(order) }],
  });

  res.status(201).json({ message: "Order placed", order });
});

app.listen(process.env.ORDSRV_PORT, () =>
  console.log(`Order Service running on port ${process.env.ORDSRV_PORT}`)
);
