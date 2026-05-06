const mongoose = require("mongoose");

const dailyFillerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["cashback", "discount"],
      required: true,
      unique: true,
    },
    label: { type: String, default: "" },
    value: { type: Number, default: 5 },
    valueType: { type: String, enum: ["$", "%"], default: "%" },
    expiryDays: { type: Number, default: 30 },
    destination: { type: String, default: "" }, // e.g. "wallet" or "next bill"
  },
  { timestamps: true }
);

module.exports = mongoose.model("DailyFiller", dailyFillerSchema);
