const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const Milestone = require("../models/Milestone");

async function addCodes() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/referral-milestones");
    console.log("✅ Connected to MongoDB\n");

    // Find all milestones without codes
    const milestonesWithoutCodes = await Milestone.find({
      $or: [
        { code: { $exists: false } },
        { code: null },
        { code: "" }
      ]
    }).sort({ createdAt: 1 });

    console.log(`📊 Found ${milestonesWithoutCodes.length} milestone(s) without codes\n`);

    if (milestonesWithoutCodes.length === 0) {
      console.log("✅ All milestones already have codes. Nothing to do.");
      process.exit(0);
    }

    // Get the last code to determine starting number
    const lastMilestoneWithCode = await Milestone.findOne({
      code: { $exists: true, $ne: null, $ne: "" }
    }).sort({ code: -1 });

    let nextNumber = 1;
    if (lastMilestoneWithCode && lastMilestoneWithCode.code) {
      const match = lastMilestoneWithCode.code.match(/^M(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
        console.log(`📋 Last existing code: ${lastMilestoneWithCode.code}`);
        console.log(`📋 Starting from: M${String(nextNumber).padStart(3, '0')}\n`);
      }
    }

    console.log("🔄 Adding codes to milestones...\n");

    let updateCount = 0;
    for (const milestone of milestonesWithoutCodes) {
      const newCode = 'M' + String(nextNumber).padStart(3, '0');
      
      try {
        await Milestone.updateOne(
          { _id: milestone._id },
          { $set: { code: newCode } }
        );
        
        console.log(`✅ ${newCode} → ${milestone.nameOfItem || 'Untitled'}`);
        updateCount++;
        nextNumber++;
      } catch (err) {
        console.error(`❌ Failed to update milestone ${milestone._id}: ${err.message}`);
      }
    }

    console.log(`\n✅ ✅ ✅ MIGRATION COMPLETE! ✅ ✅ ✅`);
    console.log(`📊 Updated ${updateCount} milestone(s) with codes\n`);

    // Verify
    const stillWithoutCodes = await Milestone.countDocuments({
      $or: [
        { code: { $exists: false } },
        { code: null },
        { code: "" }
      ]
    });

    if (stillWithoutCodes > 0) {
      console.log(`⚠️  Warning: ${stillWithoutCodes} milestone(s) still without codes`);
    } else {
      console.log("✅ All milestones now have codes!");
    }

  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

addCodes();
