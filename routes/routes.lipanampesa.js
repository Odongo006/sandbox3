import express from 'express';
const router = express.Router();

import {
  initiateSTKPush,
  stkPushCallback,
  confirmPayment
} from "../controllers/controllers.lipanampesa.js";

import { accessToken } from "../middlewares/middlewares.generateAccessToken.js";

// ✅ Route to initiate STK push
router.post('/stkPush', accessToken, initiateSTKPush);

// ✅ Safaricom will call this after user enters PIN
// Note: remove `:Order_ID` since Safaricom does NOT send it in callback URL
router.post('/stkPushCallback', stkPushCallback);

// ✅ Route to manually confirm payment by CheckoutRequestID
router.post('/confirmPayment/:CheckoutRequestID', accessToken, confirmPayment);

// ✅ New route for frontend polling/checking payment status
router.get('/payment-status/:CheckoutRequestID', async (req, res) => {
  const { CheckoutRequestID } = req.params;

  try {
    const Transaction = (await import("../models/Transaction.js")).default;

    const transaction = await Transaction.findOne({ CheckoutRequestID });

    if (!transaction) {
      return res.json({ status: "not_found" });
    }

    if (transaction.ResultCode === 0) {
      return res.json({ status: "confirmed" });
    } else if (transaction.ResultCode) {
      return res.json({ status: "failed", code: transaction.ResultCode });
    } else {
      return res.json({ status: "pending" });
    }
  } catch (err) {
    console.error("Error checking payment status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
