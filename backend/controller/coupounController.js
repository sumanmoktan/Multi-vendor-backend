const catchAsync = require("../middleware/catchAsync");
const ErrorHandler = require("../utils/ErrorHandler");
const coupounModel = require("../model/coupounModel");
const shopModel = require("../model/shopModel");

exports.createCoupon = catchAsync(async (req, res, next) => {
  try {
    const existingCoupon = await coupounModel.findOne({ name: req.body.name });

    if (existingCoupon) {
      return next(new ErrorHandler("This coupon name already exists", 400));
    }

    const coupon = await coupounModel.create(req.body);

    res.status(201).json({
      status: "success",
      coupon,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
});

exports.getallcoupoun = catchAsync(async (req, res, next) => {
  try {
    const coupoun = await coupounModel.find({ shopId: req.params.id });

    if (!coupoun) {
      return next(new ErrorHandler("Shop not found with this id", 404));
    }

    res.status(200).json({
      status: "success",
      coupoun,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
});

exports.deletecoupouns = catchAsync(async (req, res, next) => {
  try {
    const coupoun = await coupounModel.findByIdAndDelete(req.params.id);

    if (!coupoun) {
      return next(new ErrorHandler("coupouns with this id is not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "delete successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
});

//get coupon code by its name
exports.couponValue = catchAsync(async (req, res, next) => {
  const couponCode = await coupounModel.findOne({ name: req.params.name });

  if (!couponCode) {
    return next(
      new ErrorHandler("there is no coupoun code with this name", 400)
    );
  }

  res.status(200).json({
    status: "success",
    couponCode,
  });
});
