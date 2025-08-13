require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

const database = require("./config/database");
const cookieParser = require("cookie-parser");
const redisWrapper = require("./config/redis");
const { initializeSocket } = require("./config/socket");

const authRouter = require("./routes/userAuth");
const problemRouter = require("./routes/problemRoutes");
const rateLimiter = require("./middleware/rateLimiter");
const submissionRouter = require("./routes/submit");
const aiRouter = require("./routes/AiChat");
const videoRouter = require("./routes/Video");
const payRoute = require("./routes/payment");
const interviewRouter = require("./routes/aiInterview");
const contestRouter = require("./routes/contestRoute");
const playlistRouter = require("./routes/playlistRoute");
const discussionRouter = require("./routes/discussionRoute");
const dsaRouter = require("./routes/dsa");

const { autoFinalizeContestRankings } = require("./controllers/leaderboardController");
const cron = require("node-cron");
const cors = require("cors");

const PORT_NO = process.env.PORT_NO || 5000; // fallback if .env missing

// Debug: log loaded port
console.log("Loaded PORT_NO:", PORT_NO);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://ByteBattle.live'], // update origin if needed
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
// app.use(rateLimiter); // optional

// Routes
app.use("/api/user", authRouter);
app.use("/api/problem", problemRouter);
app.use("/api/submission", submissionRouter);
app.use("/api/ai", aiRouter);
app.use("/api/video", videoRouter);
app.use("/api/payments", payRoute);
app.use("/api/ai", interviewRouter);
app.use("/api/contest", contestRouter);
app.use('/api/playlists', playlistRouter);
app.use('/api/discussions', discussionRouter);
app.use("/api/dsa", dsaRouter);

// Init everything
const initialConnection = async () => {
  try {
    await database();

    const io = initializeSocket(server);

    cron.schedule('*/5 * * * *', () => {
      autoFinalizeContestRankings();
    });

    server.listen(PORT_NO, () => {
      console.log(`🚀 Server is running on port ${PORT_NO}`);
    });

    try {
      await redisWrapper.connect();
    } catch (redisErr) {
      console.warn("Redis connection failed, continuing anyway...");
    }

  } catch (err) {
    console.error("❌ Startup Error:", err);
    process.exit(1);
  }
};

initialConnection();
