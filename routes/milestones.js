const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Milestone = require("../models/Milestone");

const router = express.Router();

// ---- Multer setup for image upload ----
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PNG/JPG/WEBP/SVG allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/milestones/upload-image
router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// GET /api/milestones - list all (non-deleted)
router.get("/", async (_req, res) => {
  try {
    const items = await Milestone.find({ deletedAt: null }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/milestones/deleted - list soft-deleted (must be before /:id)
router.get("/deleted", async (_req, res) => {
  try {
    const items = await Milestone.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/milestones/:id
router.get("/:id", async (req, res) => {
  try {
    const item = await Milestone.findOne({ _id: req.params.id, deletedAt: null });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/milestones
router.post("/", async (req, res) => {
  try {
    if (!req.body.nameOfItem) {
      return res.status(400).json({ error: "nameOfItem is required" });
    }
    const item = await Milestone.create(req.body);
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/milestones/:id/restore - restore a soft-deleted milestone
router.put("/:id/restore", async (req, res) => {
  try {
    const item = await Milestone.findOneAndUpdate(
      { _id: req.params.id, deletedAt: { $ne: null } },
      { $set: { deletedAt: null } },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Not found or not deleted" });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/milestones/:id
router.put("/:id", async (req, res) => {
  try {
    if (req.body.nameOfItem === "") {
      return res.status(400).json({ error: "nameOfItem is required" });
    }
    const item = await Milestone.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/milestones/:id/permanent - hard delete with image cleanup
router.delete("/:id/permanent", async (req, res) => {
  try {
    const item = await Milestone.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    if (item.imageUrl && item.imageUrl.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", item.imageUrl);
      fs.unlink(filePath, () => {});
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/milestones/:id - soft delete (move to trash)
router.delete("/:id", async (req, res) => {
  try {
    const item = await Milestone.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
