module.exports = {
  PORT: 5002,
  CLIENT_ID: "inventory-service",
  GROUP_ID: "inventory-group",
  TOPIC_PUB: "inventory_updated",
  TOPIC_SUB: "order_placed",
  KAFKA_BROKER: "localhost:9092",
  MONGO_URI: "mongodb://localhost:27017/ecommerce",
};
