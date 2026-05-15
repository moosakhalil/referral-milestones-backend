require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

/**
 * ROLLBACK Migration: Rename freePeopleFood back to freeNumberPeople
 * 
 * Use this script ONLY if you need to undo the migration
 * 
 * USAGE: node backend/migrations/rollback_renameFreeNumberPeople.js
 */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in .env file");
  process.exit(1);
}

async function rollbackMigration() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const milestonesCollection = db.collection("milestones");

    const docsToRollback = await milestonesCollection.countDocuments({
      "reward.freePeopleFood": { $exists: true }
    });

    console.log(`\n📊 Found ${docsToRollback} milestone(s) to rollback`);

    if (docsToRollback === 0) {
      console.log("✅ No documents to rollback. Already using old field name.");
      await mongoose.disconnect();
      return;
    }

    console.log("\n🔄 Rolling back migration...");
    
    const result = await milestonesCollection.updateMany(
      { "reward.freePeopleFood": { $exists: true } },
      { $rename: { "reward.freePeopleFood": "reward.freeNumberPeople" } }
    );

    console.log(`✅ Rollback complete!`);
    console.log(`   Matched: ${result.matchedCount} document(s)`);
    console.log(`   Modified: ${result.modifiedCount} document(s)`);

    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");

  } catch (error) {
    console.error("\n❌ Rollback failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

rollbackMigration();
