const mongoose = require("mongoose");

const userNoteSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true, trim: true, unique: true },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserNote", userNoteSchema);
