const express = require("express");
const DiscountNote = require("../models/DiscountNote");

const router = express.Router();

// GET /api/discount-notes — return all notes as { itemName -> note } map
router.get("/", async (_req, res) => {
  try {
    const all = await DiscountNote.find();
    const map = {};
    for (const doc of all) map[doc.itemName] = doc.note;
    res.json(map);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/discount-notes/:itemName — upsert note for an item
router.put("/:itemName", async (req, res) => {
  const itemName = decodeURIComponent(req.params.itemName).trim();
  if (!itemName) return res.status(400).json({ error: "itemName required" });
  const note = (req.body?.note ?? "").trim();
  try {
    const doc = await DiscountNote.findOneAndUpdate(
      { itemName },
      { note },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ itemName: doc.itemName, note: doc.note });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
