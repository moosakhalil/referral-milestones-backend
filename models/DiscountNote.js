const mongoose = require("mongoose");

const discountNoteSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true, unique: true },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiscountNote", discountNoteSchema);
