const stripe = require("stripe")("sk_test_51NxQCNJx780ERXsfrJWDa5DNUVWxBDR1oTXVykVtPyRMTftAqluvds8kjGDlQeLt1Kc1ipD2UCW8n7fFG5bPOBEw00sitW3H9m");
const catchAsync = require("../middleware/catchAsync");

exports.myPayment = catchAsync(async (req, res, next) => {
  const myPayment = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: "usd",
    metadata: {
      company: "Becodemy",
    },
  });
  res.status(200).json({
    success: true,
    client_secret: myPayment.client_secret,
  });
});

exports.stripeApiKey = catchAsync(async (req, res, next) => {
  res.status(200).json({
    stripeApikey: process.env.STRIPE_API_KEY,
  });
});
