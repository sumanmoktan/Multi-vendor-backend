const express = require("express");
const paymentController = require("../controller/paymentController");

const router = express.Router();

router.post("/process", paymentController.myPayment);
router.get("/stripeapikey", paymentController.stripeApiKey);

module.exports = router;
