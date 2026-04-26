const express = require("express");
const SettingOption = require("../models/SettingOption");

const router = express.Router();
const CATEGORIES = SettingOption.CATEGORIES;

const DEFAULTS = {
  badgeGroup: [
    "Leaderboard",
    "Builder",
    "Investments",
    "Support",
    "Gambling (Spin a Wheel)",
    "Cash Reward",
    "Passive Income",
    "Discount",
    "Delivery",
    "Catalog / Discount Window",
    "Badge Founder",
    "Badge",
    "WhatsApp Status",
    "Group Discount",
    "Library",
  ],
  discountCatalog: [
    "Foremen",
    "Foreman + Commission",
    "You Referred 3",
    "New Customer Ref",
    "Hey New Customer",
    "VIP 30M",
    "Valued Customer",
    "Discount (Everyone)",
  ],
  userType: ["User", "Foreman", "Foreman+", "Foreman + Commission"],
};

// Seed defaults if a category is empty.
async function seedDefaults() {
  for (const cat of CATEGORIES) {
    const count = await SettingOption.countDocuments({ category: cat });
    if (count === 0) {
      const docs = DEFAULTS[cat].map((value, idx) => ({
        category: cat,
        value,
        order: idx,
      }));
      await SettingOption.insertMany(docs, { ordered: false }).catch(() => {});
    }
  }
}

const isValidCategory = (c) => CATEGORIES.includes(c);

// GET /api/settings -> all categories grouped
router.get("/", async (_req, res) => {
  try {
    const all = await SettingOption.find().sort({ category: 1, order: 1, value: 1 });
    const grouped = { badgeGroup: [], discountCatalog: [], userType: [] };
    for (const it of all) grouped[it.category].push(it);
    res.json(grouped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/settings/:category
router.get("/:category", async (req, res) => {
  const { category } = req.params;
  if (!isValidCategory(category)) return res.status(400).json({ error: "Invalid category" });
  try {
    const items = await SettingOption.find({ category }).sort({ order: 1, value: 1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/settings/:category  { value }
router.post("/:category", async (req, res) => {
  const { category } = req.params;
  if (!isValidCategory(category)) return res.status(400).json({ error: "Invalid category" });
  const value = (req.body?.value || "").trim();
  if (!value) return res.status(400).json({ error: "value is required" });
  try {
    const last = await SettingOption.findOne({ category }).sort({ order: -1 });
    const order = last ? (last.order || 0) + 1 : 0;
    const item = await SettingOption.create({ category, value, order });
    res.status(201).json(item);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "Value already exists" });
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/settings/:category/:id  { value }
router.put("/:category/:id", async (req, res) => {
  const { category, id } = req.params;
  if (!isValidCategory(category)) return res.status(400).json({ error: "Invalid category" });
  const value = (req.body?.value || "").trim();
  if (!value) return res.status(400).json({ error: "value is required" });
  try {
    const item = await SettingOption.findOneAndUpdate(
      { _id: id, category },
      { value },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "Value already exists" });
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/settings/:category/:id
router.delete("/:category/:id", async (req, res) => {
  const { category, id } = req.params;
  if (!isValidCategory(category)) return res.status(400).json({ error: "Invalid category" });
  try {
    const item = await SettingOption.findOneAndDelete({ _id: id, category });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
module.exports.seedDefaults = seedDefaults;
