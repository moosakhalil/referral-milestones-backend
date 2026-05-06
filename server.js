require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const milestonesRouter = require("./routes/milestones");
const settingsRouter = require("./routes/settings");
const userNotesRouter = require("./routes/userNotes");
const discountNotesRouter = require("./routes/discountNotes");
const scenariosRouter = require("./routes/scenarios");
const coreNotesRouter = require("./routes/coreNotes");
const dailyFillersRouter = require("./routes/dailyFillers");
const wheelsRouter = require("./routes/wheels");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Trust Render/Vercel/Cloudflare proxy so req.protocol reflects HTTPS.
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/milestones", milestonesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/user-notes", userNotesRouter);
app.use("/api/discount-notes", discountNotesRouter);
app.use("/api/scenarios", scenariosRouter);
app.use("/api/core-notes", coreNotesRouter);
app.use("/api/daily-fillers", dailyFillersRouter);
app.use("/api/wheels", wheelsRouter);

app.get("/", (_req, res) => res.json({ status: "Referral Milestone API running" }));

// Start HTTP server immediately so Render can detect the open port.
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on http://0.0.0.0:${PORT}`)
);

// Connect to MongoDB in the background.
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Set it in environment variables.");
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log("MongoDB connected");
      settingsRouter.seedDefaults?.().catch((err) =>
        console.error("Settings seed error:", err.message)
      );
      dailyFillersRouter.seedDefaults?.().catch((err) =>
        console.error("Daily fillers seed error:", err.message)
      );
      wheelsRouter.seedDefaults?.().catch((err) =>
        console.error("Wheels seed error:", err.message)
      );
    })
    .catch((err) => console.error("MongoDB connection error:", err.message));
}
