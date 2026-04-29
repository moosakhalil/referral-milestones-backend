const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, default: "" },
    badgeGroup: { type: String, default: "" },
    userType: { type: String, default: "" },
    nameOfItem: { type: String, required: true },
    itemNumber: { type: Number, default: null },
    nameGroupHeading: { type: String, default: "" },
    systemMode: {
      type: String,
      enum: ["manual", "automatic"],
      default: "manual",
    },
    connectedToDiscountBatchCatalog: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    discountBatchCatalogId: { type: String, default: "" },
    whatIsIt: { type: String, default: "" },
    requirements: {
      minimumSpend: { type: Number, default: 0 },
      whatsappStatusLevel: { type: Number, default: 0 },
      totalReferred: { type: Number, default: 0 },
      mixedTotal: { type: Number, default: 0 },
    },
    reward: {
      type: { type: String, default: "$" },
      value: { type: String, default: "" },
      usage: { type: String, default: "1-time use" },
      minimumSpendToUse: { type: Number, default: 0 },
      freeNumberPeople: { type: [String], default: [] },
    },
    rules: {
      rule1: { type: String, default: "" },
      rule2: { type: String, default: "" },
      rule3: { type: String, default: "" },
    },
    keepAlive: {
      durationDays: { type: String, default: "" },
      whatsappMonthly: { type: String, default: "" },
      monetaryMonthly: { type: String, default: "" },
      referred: { type: String, default: "" },
      referrals: { type: String, default: "" },
      everyTimeMix: { type: String, default: "" },
      otherwise: { type: String, default: "" },
      exceptions: { type: String, default: "" },
      anyOtherDetails: { type: String, default: "" },
    },
    repetitive: {
      enabled: { type: String, enum: ["Yes", "No"], default: "No" },
      everyTimeHitAmount: { type: String, default: "" },
      everyTimeHitWhatsappStatus: { type: String, default: "" },
      everyTimeHitReferred: { type: String, default: "" },
      referrals: { type: String, default: "" },
      everyTimeMix: { type: String, default: "" },
      need: { type: String, default: "" },
    },
    extraNotes: { type: String, default: "" },
    systemRules: { type: String, default: "" },
    exampleTextToCustomer: { type: String, default: "" },
    connectedToModule: { type: String, default: "" },
    active: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Milestone", milestoneSchema);
