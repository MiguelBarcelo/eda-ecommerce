const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const { Kafka } = require("kafkajs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const kafka = new Kafka({
  clientId: process.env.NOTIFSRV_CLIENT_ID,
  brokers: [process.env.KAFKA_BROKER],
});
const consumer = kafka.consumer({
  groupId: process.env.NOTIFSRV_GROUP_ID,
});

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: process.env.TOPIC_ORDER_UPDATES,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const orderUpdate = JSON.parse(message.value.toString());
      console.log("📢 Order update received:", orderUpdate);

      // Emit WebSocket event
      io.emit(process.env.TOPIC_ORDER_UPDATES, orderUpdate);
    },
  });
}

startConsumer().catch(console.error);

server.listen(process.env.NOTIFSRV_PORT, () =>
  console.log(
    `📡 Notification Service running on port ${process.env.NOTIFSRV_PORT}`
  )
);
