const mongoose = require("mongoose");
const Inventory = require("/app/shared/models/Inventory");

const data = [
  {
    productId: "ABC",
    quantity: 0,
  },
  {
    productId: "DEF",
    quantity: 8,
  },
  {
    productId: "GHI",
    quantity: 10,
  },
  {
    productId: "JKL",
    quantity: 4,
  },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Inventory.insertMany(data);
  console.log("Inventory added");
})();
