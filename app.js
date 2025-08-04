// app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { config } from "dotenv";

// Database + Middlewares
import dbConnection from "./database/dbConnection.js";
import { errorMiddleware } from "./middlewares/error.js";

// Routes
import userRouter from "./routes/userRoutes.js";
import jobRouter from "./routes/jobRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import lipaNaMpesaRoutes from "./routes/routes.lipanampesa.js";

const app = express();
config({ path: "./config/config.env" });

// CORS Config
const allowedOrigins = [
  "https://wekasmart.onrender.com",
  process.env.FRONTEND_URL, // make sure this is set
].filter(Boolean); // remove falsy values like undefined

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`❌ Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);


// General Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// All Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);
app.use("/api/v1/mpesa", lipaNaMpesaRoutes); // <-- merged Mpesa routes

// Database Connection
dbConnection();

// Global Error Middleware
app.use(errorMiddleware);

export default app;
