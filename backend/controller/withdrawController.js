const withdrawModel = require("../model/withdrawModel");
const shopModel = require("../model/shopModel");
const catchAsync = require("../middleware/catchAsync");
const errorHandler = require("../utils/ErrorHandler");
const sendMail = require("../utils/Email");

//for seller
exports.withdrawAmount = catchAsync(async (req, res, next) => {
  try {
    const { amount } = req.body;

    const data = {
      seller: req.seller,
      amount,
    };

    try {
      await sendMail({
        email: req.seller.email,
        subject: "Withdraw Request",
        message: `Hello ${req.seller.name}, Your withdraw request of ${amount}$ is processing. It will take 3days to 7days to processing! `,
      });
      res.status(201).json({
        success: true,
      });
    } catch (error) {
      return next(new errorHandler(error.message, 500));
    }

    const withdraw = await withdrawModelithdraw.create(data);

    const shop = await shopModel.findById(req.seller._id);

    shop.availableBalance = shop.availableBalance - amount;

    await shop.save();

    res.status(201).json({
      success: true,
      withdraw,
    });
  } catch (error) {
    return next(new errorHandler(error.message, 500));
  }
});

//for admin
exports.withdrawHandle = catchAsync(async (req, res, next) => {
  try {
    const withdraws = await withdrawModel.find().sort({ createdAt: -1 });

    res.status(201).json({
      success: true,
      withdraws,
    });
  } catch (error) {
    return next(new errorHandler(error.message, 500));
  }
});

//updating a withdraw by admin
exports.updatingWithdraw = catchAsync(async (req, res, next) => {
  try {
    const { sellerId } = req.body;

    const withdraw = await withdrawModel.findByIdAndUpdate(
      req.params.id,
      {
        status: "succeed",
        updatedAt: Date.now(),
      },
      { new: true }
    );

    const seller = await shopModel.findById(sellerId);

    const transection = {
      _id: withdraw._id,
      amount: withdraw.amount,
      updatedAt: withdraw.updatedAt,
      status: withdraw.status,
    };

    seller.transections = [...seller.transections, transection];

    await seller.save();

    try {
      await sendMail({
        email: seller.email,
        subject: "Payment confirmation",
        message: `Hello ${seller.name}, Your withdraw request of ${withdraw.amount}$ is on the way. Delivery time depends on your bank's rules it usually takes 3days to 7days.`,
      });
    } catch (error) {
      return next(new errorHandler(error.message, 500));
    }
    res.status(201).json({
      success: true,
      withdraw,
    });
  } catch (error) {
    return next(new errorHandler(error.message, 500));
  }
});
