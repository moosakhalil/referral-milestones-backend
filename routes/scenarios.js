const express = require("express");
const CustomerScenario = require("../models/CustomerScenario");

const router = express.Router();

// GET /api/scenarios
router.get("/", async (_req, res) => {
  try {
    const items = await CustomerScenario.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/scenarios
router.post("/", async (req, res) => {
  try {
    if (!req.body.name) return res.status(400).json({ error: "name is required" });
    const item = await CustomerScenario.create(req.body);
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/scenarios/:id
router.put("/:id", async (req, res) => {
  try {
    const item = await CustomerScenario.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/scenarios/:id
router.delete("/:id", async (req, res) => {
  try {
    const item = await CustomerScenario.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
