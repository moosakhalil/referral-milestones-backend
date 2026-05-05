const mongoose = require("mongoose");

const coreNoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CoreNote", coreNoteSchema);
