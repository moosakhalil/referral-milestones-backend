const express = require("express");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");

const Milestone = require("../models/Milestone");
const SettingOption = require("../models/SettingOption");
const UserNote = require("../models/UserNote");
const DiscountNote = require("../models/DiscountNote");
const CustomerScenario = require("../models/CustomerScenario");
const CoreNote = require("../models/CoreNote");
const DailyFiller = require("../models/DailyFiller");
const WheelConfig = require("../models/WheelConfig");

const router = express.Router();

// Flatten nested objects/arrays into dot-keyed strings so they fit in cells.
function flatten(obj, prefix = "", out = {}) {
  if (obj === null || obj === undefined) return out;
  // ObjectId -> hex string (avoids dumping Buffer bytes as columns).
  if (obj instanceof mongoose.Types.ObjectId) {
    out[prefix] = obj.toString();
    return out;
  }
  if (Buffer.isBuffer(obj)) {
    out[prefix] = obj.toString("hex");
    return out;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      out[prefix] = "";
    } else if (obj.every((v) => v === null || typeof v !== "object")) {
      out[prefix] = obj.join(", ");
    } else {
      obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
    }
    return out;
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      flatten(v, key, out);
    }
    return out;
  }
  out[prefix] = obj instanceof Date ? obj.toISOString() : obj;
  return out;
}

function docsToSheet(docs) {
  const rows = docs.map((d) => {
    const obj = typeof d.toObject === "function" ? d.toObject() : d;
    // Drop Mongoose internals.
    delete obj.__v;
    return flatten(obj);
  });

  // Collect every key across rows for a stable, complete header.
  const headerSet = new Set();
  rows.forEach((r) => Object.keys(r).forEach((k) => headerSet.add(k)));
  const headers = Array.from(headerSet);

  const aoa = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Auto-size columns (cap width).
  ws["!cols"] = headers.map((h) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((r) => String(r[h] ?? "").length)
    );
    return { wch: Math.min(60, Math.max(10, maxLen + 2)) };
  });
  return ws;
}

router.get("/excel", async (_req, res) => {
  try {
    const [
      milestones,
      milestonesDeleted,
      settings,
      userNotes,
      discountNotes,
      scenarios,
      coreNotes,
      dailyFillers,
      wheels,
    ] = await Promise.all([
      Milestone.find({ deletedAt: null }).lean(),
      Milestone.find({ deletedAt: { $ne: null } }).lean(),
      SettingOption.find({}).lean(),
      UserNote.find({}).lean(),
      DiscountNote.find({}).lean(),
      CustomerScenario.find({}).lean(),
      CoreNote.find({}).lean(),
      DailyFiller.find({}).lean(),
      WheelConfig.find({}).lean(),
    ]);

    const wb = XLSX.utils.book_new();
    const sheets = [
      ["Milestones", milestones],
      ["Milestones (Trash)", milestonesDeleted],
      ["Settings", settings],
      ["UserNotes", userNotes],
      ["DiscountNotes", discountNotes],
      ["Scenarios", scenarios],
      ["CoreNotes", coreNotes],
      ["DailyFillers", dailyFillers],
      ["Wheels", wheels],
    ];

    sheets.forEach(([name, docs]) => {
      const ws = docsToSheet(docs.length ? docs : [{ note: "no records" }]);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    });

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="referral-milestones-${stamp}.xlsx"`
    );
    res.send(buffer);
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ----- PDF export -----------------------------------------------------------

async function loadAllData() {
  const [
    milestones,
    milestonesDeleted,
    settings,
    userNotes,
    discountNotes,
    scenarios,
    coreNotes,
    dailyFillers,
    wheels,
  ] = await Promise.all([
    Milestone.find({ deletedAt: null }).lean(),
    Milestone.find({ deletedAt: { $ne: null } }).lean(),
    SettingOption.find({}).lean(),
    UserNote.find({}).lean(),
    DiscountNote.find({}).lean(),
    CustomerScenario.find({}).lean(),
    CoreNote.find({}).lean(),
    DailyFiller.find({}).lean(),
    WheelConfig.find({}).lean(),
  ]);
  return [
    ["Milestones", milestones],
    ["Milestones (Trash)", milestonesDeleted],
    ["Settings", settings],
    ["User Notes", userNotes],
    ["Discount Notes", discountNotes],
    ["Scenarios", scenarios],
    ["Core Notes", coreNotes],
    ["Daily Fillers", dailyFillers],
    ["Wheels", wheels],
  ];
}

// Skip noisy/irrelevant fields in the PDF render.
const SKIP_KEYS = new Set(["_id", "__v", "createdAt", "updatedAt", "deletedAt"]);

function renderRecord(doc, record, index) {
  const flat = flatten(record);
  const entries = Object.entries(flat).filter(
    ([k, v]) =>
      !SKIP_KEYS.has(k.split(".")[0]) &&
      v !== "" &&
      v !== null &&
      v !== undefined
  );

  if (doc.y > doc.page.height - 120) doc.addPage();

  doc
    .fontSize(11)
    .fillColor("#1e3a8a")
    .font("Helvetica-Bold")
    .text(`#${index + 1}`, { continued: false });
  doc.moveDown(0.2);

  doc.fontSize(9).fillColor("#111827").font("Helvetica");
  entries.forEach(([k, v]) => {
    if (doc.y > doc.page.height - 60) doc.addPage();
    const label = k;
    const value = String(v);
    doc.font("Helvetica-Bold").fillColor("#374151").text(`${label}: `, {
      continued: true,
    });
    doc.font("Helvetica").fillColor("#111827").text(value);
  });

  doc.moveDown(0.6);
  doc
    .strokeColor("#e5e7eb")
    .lineWidth(0.5)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(0.6);
}

router.get("/pdf", async (_req, res) => {
  try {
    const sections = await loadAllData();

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="referral-milestones-${stamp}.pdf"`
    );

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: "Referral Milestones Export",
        Author: "Referral Milestones App",
      },
    });
    doc.pipe(res);

    // Cover / title page
    doc
      .fontSize(22)
      .fillColor("#1e3a8a")
      .font("Helvetica-Bold")
      .text("Referral Milestones — Full Data Export", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .fillColor("#6b7280")
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1);

    doc
      .fontSize(13)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text("Contents");
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").fillColor("#374151");
    sections.forEach(([name, data]) => {
      doc.text(`• ${name} (${data.length})`);
    });

    sections.forEach(([name, data]) => {
      doc.addPage();
      doc
        .fontSize(18)
        .fillColor("#1e3a8a")
        .font("Helvetica-Bold")
        .text(name);
      doc
        .fontSize(10)
        .fillColor("#6b7280")
        .font("Helvetica")
        .text(`${data.length} record${data.length === 1 ? "" : "s"}`);
      doc.moveDown(0.8);

      if (!data.length) {
        doc.fontSize(10).fillColor("#9ca3af").text("No records.");
        return;
      }

      data.forEach((rec, i) => renderRecord(doc, rec, i));
    });

    doc.end();
  } catch (err) {
    console.error("PDF export error:", err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.end();
  }
});

module.exports = router;
