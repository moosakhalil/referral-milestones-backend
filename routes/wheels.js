const express = require("express");
const WheelConfig = require("../models/WheelConfig");

const router = express.Router();

const SHARED_CUSTOMER_TEXTS = [
  "A little extra back to brighten your day.",
  "A double-digit reward for your relentless drive.",
  "A perfect ten back for your persistence.",
  "A stellar reward for a truly out-of-this-world customer.",
  "A spectacular reward to make your purchase even better.",
  "Celebrate your savings like a true winner.",
  "A stellar reward that is truly out of this world.",
  "Reach for the stars and grab your celestial savings.",
  "Score big with a quarter of your cash returned to you.",
  "Out-of-this-world savings headed straight to your pocket.",
  "Enjoy your slice of the savings.",
  "Get some serious green back with this thirty dollar reward.",
  "A rewarding drop straight back into your wallet.",
  "Hit the jackpot with a big forty dollar reward.",
  "A powerful explosion of savings hitting your wallet.",
  "A nifty fifty back to keep your wallet happy.",
  "A massive explosion of cash back rewards.",
  "Enjoy a solid fifty back as a reward for your loyalty.",
  "A premier reward that truly stands above the rest.",
  "Secure your status with legendary savings.",
];

const DEFAULTS = [
  // ── Cashback wheel ────────────────────────────────────────────────────────
  {
    key: "cashback",
    title: "Cashback Wheel",
    subtitle: "Filler reward · credited to wallet",
    rotationSlots: [
      { label: "1% cashback to wallet", rewardType: "%", value: "1", destination: "wallet", probability: 0 },
      { label: "2% cashback to wallet", rewardType: "%", value: "2", destination: "wallet", probability: 0 },
      { label: "Cashback Wheel OR 0.5% cashback to wallet", rewardType: "%", value: "0.5", destination: "wallet", probability: 0, notes: "When this slot lands, customer gets to spin the cashback wheel below." },
    ],
    segments: [
      { label: "2% cashback",                 rewardType: "%",     value: "2",       destination: "wallet",  probability: 10 },
      { label: "Food 15k",                    rewardType: "food",  value: "15k",     destination: "manual",  probability: 10 },
      { label: "Food 1%",                     rewardType: "food",  value: "1%",      destination: "manual",  probability: 10 },
      { label: "Just 0.5%",                   rewardType: "%",     value: "0.5",     destination: "wallet",  probability: 40 },
      { label: "Holiday food family 4ppl 15k min", rewardType: "food", value: "15k+", destination: "manual", probability: 10 },
      { label: "Wife rose",                   rewardType: "item",  value: "rose",    destination: "manual",  probability: 5  },
      { label: "Kids cone ice cream",         rewardType: "item",  value: "ice cream", destination: "manual", probability: 15 },
    ],
    customerTexts: SHARED_CUSTOMER_TEXTS,
    rules:
      "When the cashback rotation slot lands and the segment is a % cashback, value goes straight to the wallet. " +
      "Any non-cash reward (food, item, etc.) must be recorded in the system manually for redemption tracking. " +
      "Customer messages rotate so no two consecutive wins use the same text.",
    integrationNotes: "",
  },

  // ── Discount wheel ────────────────────────────────────────────────────────
  {
    key: "discount",
    title: "Discount Wheel",
    subtitle: "Filler reward · applied to next bill",
    rotationSlots: [
      { label: "1% discount on next bill", rewardType: "%", value: "1", destination: "next bill", probability: 0 },
      { label: "2% discount on next bill", rewardType: "%", value: "2", destination: "next bill", probability: 0 },
      { label: "Discount Wheel OR 0.5% discount on next bill", rewardType: "%", value: "0.5", destination: "next bill", probability: 0, notes: "When this slot lands, customer gets to spin the discount wheel below." },
    ],
    segments: [
      { label: "2% discount",                 rewardType: "%",     value: "2",       destination: "next bill", probability: 10 },
      { label: "Food 15k",                    rewardType: "food",  value: "15k",     destination: "manual",    probability: 10 },
      { label: "Food 1%",                     rewardType: "food",  value: "1%",      destination: "manual",    probability: 10 },
      { label: "Just 0.5%",                   rewardType: "%",     value: "0.5",     destination: "next bill", probability: 40 },
      { label: "Holiday food family 4ppl 15k min", rewardType: "food", value: "15k+", destination: "manual",   probability: 10 },
      { label: "Wife rose",                   rewardType: "item",  value: "rose",    destination: "manual",    probability: 5  },
      { label: "Kids cone ice cream",         rewardType: "item",  value: "ice cream", destination: "manual",  probability: 15 },
    ],
    customerTexts: SHARED_CUSTOMER_TEXTS,
    rules:
      "When the discount rotation slot lands and the segment is a % discount, value comes off the customer's next bill. " +
      "Any non-cash reward (food, item, etc.) must be recorded in the system manually for redemption tracking. " +
      "Customer messages rotate so no two consecutive wins use the same text.",
    integrationNotes: "",
  },

  // ── Gamble wheel (general milestone wheel) ────────────────────────────────
  {
    key: "gamble",
    title: "Gamble (Spin a Wheel)",
    subtitle: "General milestone wheel · IRREGULAR + SURPRISE every ~5 milestones",
    rotationSlots: [],
    segments: [], // gamble outcomes are described in `stats` instead
    customerTexts: [
      "🔥 Bro I just hit a milestone and got DOUBLE 😳",
      "🎰 Spin to upgrade — better odds with gift cards.",
    ],
    nudgeTexts: [
      "🔥 You are 2 referrals away from UNLOCKING a reward gamble … don't miss it.",
      "🔥 You are 2 referrals away from UNLOCKING a reward gamble (up to 500k)… don't miss it.",
      "Only 2 more levels to reach before the next gamble — maybe the next one has it…",
    ],
    statsSampleSize: 104,
    stats: [
      { label: "Win 5k IRD only",                                                 probability: 26, value: "5k",   notes: "Baseline reward." },
      { label: "Bakso / meal for 1 person (≈10k value, depends on day's menu)",   probability: 43, value: "10k",  notes: "Largest win bucket." },
      { label: "Win 10k cash",                                                    probability: 15, value: "10k",  notes: "" },
      { label: "Bakso XL / meal for 1 person (≈15k value, depends on day's menu)",probability: 6,  value: "15k",  notes: "" },
      { label: "Win 15k cash",                                                    probability: 5,  value: "15k",  notes: "" },
      { label: "Bakso / meal for 5 people (≈50k value, depends on day's menu)",   probability: 6,  value: "50k",  notes: "" },
      { label: "Win 50k cash",                                                    probability: 2,  value: "50k",  notes: "" },
      { label: "Win 600k jackpot",                                                probability: 1,  value: "600k", notes: "Send WhatsApp to friend list: \"Rina won jackpot 🎰\"" },
    ],
    rules: [
      "CORE LOGIC: Every ~5 milestones — 4 guaranteed rewards + 5th = UPGRADE GAMBLE.",
      "Don't fix the ratio at 1/5; keep it IRREGULAR + SURPRISE.",
      "Examples: M3→no, M7→gamble, M11→gamble, M18→BIG gamble, M25→no.",
      "Send hook text 2 levels before next gamble: \"Maybe next one has it…\"",
      "Early levels → smaller gamble (safe feeling). Mid levels → better rewards.",
      "",
      "ACTIVATION:",
      "• Customer must complete a single-bill purchase of 500k to trigger the wheel.",
      "• The spin opportunity persists until a qualifying 500k single-bill purchase is made.",
      "• Purchases of 500k made BEFORE the wheel was unlocked do NOT count — only the next qualifying purchase after unlock counts.",
      "",
      "HIGH-VALUE EXCEPTION:",
      "• If total spend over the last 5 bills exceeds 5M, the wheel may trigger for purchases as low as 250k (minimum threshold 200k).",
      "",
      "EXPIRY:",
      "• 14-bill window for the wheel to be activated.",
      "• If no qualifying purchase is made within 14 bills, the OLDEST gambling wheel is lost.",
      "• Maximum of 3 consecutive gambling wheels can be held at any time.",
      "",
      "ON JACKPOT:",
      "• Send WhatsApp to the customer's friend list: \"Rina won jackpot 🎰\".",
      "• Use the customer's actual name in the message.",
      "",
      "ANY non-cash win (food / item / gift card) must be recorded in the system for redemption tracking.",
    ].join("\n"),
    integrationNotes: "",
  },
];

async function seedDefaults() {
  for (const def of DEFAULTS) {
    const existing = await WheelConfig.findOne({ key: def.key });
    if (!existing) {
      await WheelConfig.create(def);
      console.log(`Wheel config seeded: ${def.key}`);
    }
  }
}

// GET /api/wheels  — return all three
router.get("/", async (_req, res) => {
  try {
    const items = await WheelConfig.find().sort({ key: 1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/wheels/:key
router.get("/:key", async (req, res) => {
  try {
    const item = await WheelConfig.findOne({ key: req.params.key });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/wheels/:key  — full upsert update
router.put("/:key", async (req, res) => {
  try {
    const allowed = ["cashback", "discount", "gamble"];
    if (!allowed.includes(req.params.key)) {
      return res.status(400).json({ error: "Invalid wheel key" });
    }
    const update = { ...req.body };
    delete update._id;
    delete update.key;

    const item = await WheelConfig.findOneAndUpdate(
      { key: req.params.key },
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.seedDefaults = seedDefaults;
module.exports = router;
