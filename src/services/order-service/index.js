const express = require("express");
const mongoose = require("mongoose");
const { Kafka } = require("kafkajs");
require("dotenv").config();

const {
  PORT,
  TOPIC,
  KAFKA_BROKER,
  CLIENT_ID,
  MONGO_URI,
} = require("./constants");

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || MONGO_URI, {
  useNewUrlParser: true, // Warning: useNewUrlParser is a deprecated option: useNewUrlParser has no effect since Node.js Driver version 4.0.0 and will be removed in the next major version
  useUnifiedTopology: true, // Warning: useUnifiedTopology is a deprecated option: useUnifiedTopology has no effect since Node.js Driver version 4.0.0 and will be removed in the next major version
});

// Kafka Producer Setup
const kafka = new Kafka({
  clientId: CLIENT_ID,
  brokers: [process.env.KAFKA_BROKER || KAFKA_BROKER],
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
    topic: TOPIC,
    messages: [{ value: JSON.stringify(order) }],
  });

  res.status(201).json({ message: "Order placed", order });
});

app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
