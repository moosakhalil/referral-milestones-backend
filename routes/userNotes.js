const express = require("express");
const UserNote = require("../models/UserNote");

const router = express.Router();

// GET /api/user-notes — return all notes as { userName -> note } map
router.get("/", async (_req, res) => {
  try {
    const all = await UserNote.find();
    const map = {};
    for (const doc of all) map[doc.userName] = doc.note;
    res.json(map);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/user-notes/:userName — upsert note for a user
router.put("/:userName", async (req, res) => {
  const userName = decodeURIComponent(req.params.userName).trim();
  if (!userName) return res.status(400).json({ error: "userName required" });
  const note = (req.body?.note ?? "").trim();
  try {
    const doc = await UserNote.findOneAndUpdate(
      { userName },
      { note },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ userName: doc.userName, note: doc.note });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
