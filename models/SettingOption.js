const mongoose = require("mongoose");

const CATEGORIES = ["badgeGroup", "discountCatalog", "userType"];

const settingOptionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
      index: true,
    },
    value: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

settingOptionSchema.index({ category: 1, value: 1 }, { unique: true });

const SettingOption = mongoose.model("SettingOption", settingOptionSchema);
SettingOption.CATEGORIES = CATEGORIES;

module.exports = SettingOption;
