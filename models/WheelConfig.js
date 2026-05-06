const mongoose = require("mongoose");

// Each segment of a wheel — a possible outcome with a probability.
const segmentSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    // optional structured fields, kept generic for flexibility
    rewardType: { type: String, default: "" }, // e.g. "%", "$", "food", "item", "cashback wheel"
    value: { type: String, default: "" },       // numeric or descriptive
    probability: { type: Number, default: 0 },  // 0–100
    destination: { type: String, default: "" }, // wallet | next bill | manual | etc.
    notes: { type: String, default: "" },
  },
  { _id: false }
);

// Generic statistic row used by the gamble wheel (e.g. "26% will win only 5k IRD").
const statRowSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    probability: { type: Number, default: 0 },
    value: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const wheelConfigSchema = new mongoose.Schema(
  {
    // wheel identifier — one document per wheel
    key: {
      type: String,
      enum: ["cashback", "discount", "gamble"],
      required: true,
      unique: true,
    },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },

    // Used by cashback / discount: the 3 rotation slots
    rotationSlots: { type: [segmentSchema], default: [] },

    // Used by all wheels: the actual sub-wheel segments with probabilities
    segments: { type: [segmentSchema], default: [] },

    // Library of customer-facing messages (rotate through these).
    customerTexts: { type: [String], default: [] },

    // Operational rules — long form (markdown-ish plain text).
    rules: { type: String, default: "" },

    // Pre-spin / nudge messages (e.g. "You are 2 referrals away…").
    nudgeTexts: { type: [String], default: [] },

    // Stats spec (gamble): "from 104 spins, 26% win 5k IRD…".
    stats: { type: [statRowSchema], default: [] },
    statsSampleSize: { type: Number, default: 0 },

    // Free-form text-box for any additional info to help future integration.
    integrationNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WheelConfig", wheelConfigSchema);
