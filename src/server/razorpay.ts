import "server-only";

import Razorpay from "razorpay";
import type { ServerPaymentEnv } from "@/server/payment-env";

export function createRazorpayClient(config: ServerPaymentEnv): Razorpay {
  return new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET,
  });
}
