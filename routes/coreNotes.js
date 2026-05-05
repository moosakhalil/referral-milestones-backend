const express = require("express");
const CoreNote = require("../models/CoreNote");

const router = express.Router();

// GET /api/core-notes
router.get("/", async (_req, res) => {
  try {
    const notes = await CoreNote.find().sort({ createdAt: 1 });
    res.json(notes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/core-notes
router.post("/", async (req, res) => {
  const text = (req.body?.text ?? "").trim();
  if (!text) return res.status(400).json({ error: "text required" });
  try {
    const doc = await CoreNote.create({ text });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/core-notes/:id
router.put("/:id", async (req, res) => {
  const text = (req.body?.text ?? "").trim();
  if (!text) return res.status(400).json({ error: "text required" });
  try {
    const doc = await CoreNote.findByIdAndUpdate(
      req.params.id,
      { text },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/core-notes/:id
router.delete("/:id", async (req, res) => {
  try {
    await CoreNote.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
