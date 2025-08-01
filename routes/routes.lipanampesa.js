import express from 'express';
const router = express.Router();

import {
  initiateSTKPush,
  stkPushCallback,
  confirmPayment
} from "../controllers/controllers.lipanampesa.js";

import { accessToken } from "../middlewares/middlewares.generateAccessToken.js";

// Original routes
router.route('/stkPush').post(accessToken, initiateSTKPush);
router.route('/stkPushCallback/:Order_ID').post(stkPushCallback);
router.route('/confirmPayment/:CheckoutRequestID').post(accessToken, confirmPayment);

// ✅ New route for frontend feedback polling
router.route('/payment-status/:CheckoutRequestID').get(async (req, res) => {
  const { CheckoutRequestID } = req.params;

  try {
    const Transaction = (await import("../models/Transaction.js")).default;

    const transaction = await Transaction.findOne({ CheckoutRequestID });

    if (transaction && transaction.ResultCode === 0) {
      res.json({ status: "confirmed" });
    } else {
      res.json({ status: "pending" });
    }
  } catch (err) {
    console.error("Error checking payment status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
