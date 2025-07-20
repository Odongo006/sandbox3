import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import 'dotenv/config';

// initialize express
const app = express();

// middlewares
app.use(express.json());
app.use(cors());

// MongoDB connection using Mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected via Mongoose"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// import routes
import lipaNaMpesaRoutes from "./routes/routes.lipanampesa.js";
app.use('/api', lipaNaMpesaRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 App listening on port ${port}`);
});
