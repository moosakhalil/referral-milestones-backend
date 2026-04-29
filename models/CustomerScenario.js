const mongoose = require("mongoose");

const customerScenarioSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    weeklySpend: { type: Number, default: 0 },
    waFrequency: { type: String, default: "1 per day" },
    mixedCurrent: { type: Number, default: 0 },
    referredFrequency: { type: String, default: "1 week" },
    individualTransaction: { type: Number, default: 0 },
    timePassed: { type: String, default: "Not started" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomerScenario", customerScenarioSchema);
