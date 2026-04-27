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
    "Badge Founder",
    "Badge",
    "WhatsApp Status",
    "Group Discount",
    "Library",
  ],
  userType: ["User", "Foreman", "Foreman+", "Foreman + Commission"],
};

const HOLIDAY_BASE = [
  "Sale (Christmas)",
  "Sale (New Year – 1st Jan)",
  "Sale (Independence Day)",
  "Sale (Ramadan)",
  "Sale (Eid)",
  "Sale (Eid al-Adha)",
  "Sale (Black Friday)",
  "Sale (Nyepi)",
];

// Grouped defaults for discountCatalog (each item belongs to a heading).
const DISCOUNT_CATALOG_GROUPS = [
  {
    heading: "Holidays",
    items: [...HOLIDAY_BASE, ...HOLIDAY_BASE.map((h) => `${h} — All Users`)],
  },
  {
    heading: "User",
    items: [
      "Daily Deals",
      "Foreman (Discount Window)",
      "Foreman+ (Discount Window)",
      "Foreman + Commission (Discount Window)",
    ],
  },
  {
    heading: "Trade Off",
    items: [
      "Referral (3)",
      "VIP (30M)",
      "Valued (100M)",
      "VIP (130M)",
      "Status (3 times last week)",
    ],
  },
  {
    heading: "Product Related",
    items: [
      "Product Testing",
      "Limited Deals",
      "Low Stock Priority Buy",
      "Low Stock Information",
      "Low Stock Deals",
      "Last Stock Deals",
    ],
  },
  {
    heading: "Activity",
    items: [
      "Active",
      "Super Active (Buy 3 Days)",
      "Super Active (Buy 5 Days)",
      "Super Active (Buy 10 Days)",
    ],
  },
];

const HEADING_ORDER = DISCOUNT_CATALOG_GROUPS.map((g) => g.heading);
const headingRank = (h) => {
  const i = HEADING_ORDER.indexOf(h || "");
  return i === -1 ? 999 : i;
};

const isValidCategory = (c) => CATEGORIES.includes(c);

// Seed defaults if a category is empty. Auto-migrate discountCatalog to the
// new grouped structure if old flat records exist (no group field set).
async function seedDefaults() {
  // Flat categories
  for (const cat of ["badgeGroup", "userType"]) {
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

  // Grouped category: discountCatalog
  const total = await SettingOption.countDocuments({ category: "discountCatalog" });
  const groupedCount = await SettingOption.countDocuments({
    category: "discountCatalog",
    group: { $nin: ["", null] },
  });

  if (total === 0 || groupedCount === 0) {
    // Empty OR old flat data exists: reseed grouped from scratch.
    if (total > 0) {
      await SettingOption.deleteMany({ category: "discountCatalog" });
    }
    const docs = [];
    DISCOUNT_CATALOG_GROUPS.forEach((g) => {
      g.items.forEach((value, idx) => {
        docs.push({
          category: "discountCatalog",
          group: g.heading,
          value,
          order: idx,
        });
      });
    });
    await SettingOption.insertMany(docs, { ordered: false }).catch(() => {});
  } else {
    // Top up: insert any missing default items (idempotent).
    for (const g of DISCOUNT_CATALOG_GROUPS) {
      for (let i = 0; i < g.items.length; i++) {
        const value = g.items[i];
        const exists = await SettingOption.findOne({
          category: "discountCatalog",
          group: g.heading,
          value,
        });
        if (!exists) {
          await SettingOption.create({
            category: "discountCatalog",
            group: g.heading,
            value,
            order: i,
          }).catch(() => {});
        }
      }
    }
  }
}

const sortDiscount = (a, b) => {
  const ra = headingRank(a.group);
  const rb = headingRank(b.group);
  if (ra !== rb) return ra - rb;
  if ((a.order || 0) !== (b.order || 0)) return (a.order || 0) - (b.order || 0);
  return a.value.localeCompare(b.value);
};

const sortFlat = (a, b) =>
  (a.order || 0) - (b.order || 0) || a.value.localeCompare(b.value);

// GET /api/settings -> all categories grouped
router.get("/", async (_req, res) => {
  try {
    const all = await SettingOption.find();
    const grouped = { badgeGroup: [], discountCatalog: [], userType: [] };
    for (const it of all) grouped[it.category].push(it);
    grouped.discountCatalog.sort(sortDiscount);
    grouped.badgeGroup.sort(sortFlat);
    grouped.userType.sort(sortFlat);
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
    const items = await SettingOption.find({ category });
    items.sort(category === "discountCatalog" ? sortDiscount : sortFlat);
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/settings/:category  { value, group? }
router.post("/:category", async (req, res) => {
  const { category } = req.params;
  if (!isValidCategory(category)) return res.status(400).json({ error: "Invalid category" });
  const value = (req.body?.value || "").trim();
  const group = (req.body?.group || "").trim();
  if (!value) return res.status(400).json({ error: "value is required" });
  try {
    const last = await SettingOption.findOne({ category, group }).sort({ order: -1 });
    const order = last ? (last.order || 0) + 1 : 0;
    const item = await SettingOption.create({ category, value, group, order });
    res.status(201).json(item);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "Value already exists" });
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/settings/:category/:id  { value, group? }
router.put("/:category/:id", async (req, res) => {
  const { category, id } = req.params;
  if (!isValidCategory(category)) return res.status(400).json({ error: "Invalid category" });
  const value = (req.body?.value || "").trim();
  if (!value) return res.status(400).json({ error: "value is required" });
  const update = { value };
  if (typeof req.body?.group === "string") update.group = req.body.group.trim();
  try {
    const item = await SettingOption.findOneAndUpdate(
      { _id: id, category },
      update,
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
