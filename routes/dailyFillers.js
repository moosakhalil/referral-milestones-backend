const express = require("express");
const DailyFiller = require("../models/DailyFiller");

const router = express.Router();

const DEFAULTS = [
  {
    type: "cashback",
    label: "Filling Cashback Wheel",
    value: 5,
    valueType: "%",
    expiryDays: 30,
    destination: "wallet",
  },
  {
    type: "discount",
    label: "Filling Discount Wheel",
    value: 10,
    valueType: "%",
    expiryDays: 30,
    destination: "next bill",
  },
];

async function seedDefaults() {
  const count = await DailyFiller.countDocuments();
  if (count === 0) {
    await DailyFiller.insertMany(DEFAULTS);
    console.log("Daily filler defaults seeded");
  }

  // Migration: rename legacy filler labels to the new "Filling … Wheel" format.
  try {
    await DailyFiller.updateOne(
      { type: "cashback", label: "Cashback Filler" },
      { $set: { label: "Filling Cashback Wheel" } }
    );
    await DailyFiller.updateOne(
      { type: "discount", label: "Discount Filler" },
      { $set: { label: "Filling Discount Wheel" } }
    );
  } catch (e) {
    console.warn("Daily filler label migration failed:", e.message);
  }
}

// GET /api/daily-fillers
router.get("/", async (_req, res) => {
  try {
    const items = await DailyFiller.find().sort({ type: 1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/daily-fillers/:type  (cashback | discount)
router.put("/:type", async (req, res) => {
  try {
    const allowed = ["cashback", "discount"];
    if (!allowed.includes(req.params.type)) {
      return res.status(400).json({ error: "Invalid filler type" });
    }
    const { value, valueType, expiryDays, label, destination } = req.body;
    const update = {};
    if (value !== undefined)      update.value      = Number(value);
    if (valueType !== undefined)  update.valueType  = valueType;
    if (expiryDays !== undefined) update.expiryDays = Number(expiryDays);
    if (label !== undefined)      update.label      = label;
    if (destination !== undefined) update.destination = destination;

    const item = await DailyFiller.findOneAndUpdate(
      { type: req.params.type },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.seedDefaults = seedDefaults;
module.exports = router;
