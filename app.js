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
app.use(
  cors({
    origin: ["https://wekasmart.onrender.com", process.env.FRONTEND_URL],
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
