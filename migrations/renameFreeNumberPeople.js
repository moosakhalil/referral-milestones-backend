require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

/**
 * Migration: Rename freeNumberPeople to freePeopleFood
 * 
 * This script safely renames the field in all existing milestone documents
 * without losing any data.
 * 
 * USAGE: node backend/migrations/renameFreeNumberPeople.js
 */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in .env file");
  process.exit(1);
}

async function runMigration() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const milestonesCollection = db.collection("milestones");

    // Step 1: Check how many documents have the old field
    const docsWithOldField = await milestonesCollection.countDocuments({
      "reward.freeNumberPeople": { $exists: true }
    });

    console.log(`\n📊 Found ${docsWithOldField} milestone(s) with 'freeNumberPeople' field`);

    if (docsWithOldField === 0) {
      console.log("✅ No documents to migrate. All done!");
      await mongoose.disconnect();
      return;
    }

    // Step 2: Show sample data before migration
    const sampleDoc = await milestonesCollection.findOne({
      "reward.freeNumberPeople": { $exists: true }
    });

    if (sampleDoc) {
      console.log("\n📋 Sample document BEFORE migration:");
      console.log(`   Milestone: ${sampleDoc.nameOfItem}`);
      console.log(`   Old field value: ${JSON.stringify(sampleDoc.reward?.freeNumberPeople)}`);
    }

    // Step 3: Perform the rename operation
    console.log("\n🔄 Starting migration...");
    
    const result = await milestonesCollection.updateMany(
      { "reward.freeNumberPeople": { $exists: true } },
      { $rename: { "reward.freeNumberPeople": "reward.freePeopleFood" } }
    );

    console.log(`✅ Migration complete!`);
    console.log(`   Matched: ${result.matchedCount} document(s)`);
    console.log(`   Modified: ${result.modifiedCount} document(s)`);

    // Step 4: Verify the migration
    console.log("\n🔍 Verifying migration...");
    
    const docsWithNewField = await milestonesCollection.countDocuments({
      "reward.freePeopleFood": { $exists: true }
    });

    const docsStillWithOldField = await milestonesCollection.countDocuments({
      "reward.freeNumberPeople": { $exists: true }
    });

    console.log(`   Documents with NEW field (freePeopleFood): ${docsWithNewField}`);
    console.log(`   Documents still with OLD field (freeNumberPeople): ${docsStillWithOldField}`);

    // Step 5: Show sample data after migration
    const sampleDocAfter = await milestonesCollection.findOne({
      "reward.freePeopleFood": { $exists: true }
    });

    if (sampleDocAfter) {
      console.log("\n📋 Sample document AFTER migration:");
      console.log(`   Milestone: ${sampleDocAfter.nameOfItem}`);
      console.log(`   New field value: ${JSON.stringify(sampleDocAfter.reward?.freePeopleFood)}`);
    }

    if (docsStillWithOldField === 0 && docsWithNewField === docsWithOldField) {
      console.log("\n✅ ✅ ✅ MIGRATION SUCCESSFUL! ✅ ✅ ✅");
      console.log("   All documents have been migrated successfully.");
      console.log("   You can now update your code to use 'freePeopleFood'");
    } else {
      console.warn("\n⚠️  WARNING: Migration may be incomplete");
      console.warn("   Please review the counts above and check your database manually");
    }

    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the migration
runMigration();
