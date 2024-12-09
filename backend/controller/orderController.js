const catchAsync = require("../middleware/catchAsync");
const ErrorHandler = require("../utils/ErrorHandler");
const orderModel = require("../model/orderModel");
const productModel = require("../model/productModel");
const shopModel = require("../model/shopModel");

exports.createOrder = catchAsync(async (req, res, next) => {
  try {
    const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

    //   group cart items by shopId
    const shopItemsMap = new Map();

    for (const item of cart) {
      const shopId = item.shopId;
      if (!shopItemsMap.has(shopId)) {
        shopItemsMap.set(shopId, []);
      }
      shopItemsMap.get(shopId).push(item);
    }

    // create an order for each shop
    const orders = [];

    for (const [shopId, items] of shopItemsMap) {
      const order = await orderModel.create({
        cart: items,
        shippingAddress,
        user,
        totalPrice,
        paymentInfo,
      });
      orders.push(order);
    }

    res.status(201).json({
      success: true,
      orders,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

//Getting all order of user
exports.UserOder = catchAsync(async (req, res, next) => {
  const orders = await orderModel.find({ "user._id": req.params.userId }).sort({
    createdAt: -1,
  });

  if (!orders) {
    return next(new ErrorHandler("Oder is not found with this userId", 404));
  }

  res.status(200).json({
    status: "success",
    orders,
  });
});

//Getting all order of seller
exports.SellerOrder = catchAsync(async (req, res, next) => {
  const orders = await orderModel
    .find({ "cart.shopId": req.params.shopId })
    .sort({
      createdAt: -1,
    });

  if (!orders) {
    return next(new ErrorHandler("Order with this id is not found", 404));
  }

  res.status(200).json({
    status: "success",
    orders,
  });
});

//update order status for seller
exports.updateStatus = catchAsync(async (req, res, next) => {
  const order = await orderModel.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order is not found with this id", 404));
  }

  if (req.body.status === "Transferred to delivery partner") {
    order.cart.forEach(async (o) => {
      await updateOrder(o._id, o.qty);
    });
  }
  order.status = req.body.status;

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
    order.paymentInfo.status = "Succeeded";
    const serviceCharge = order.totalPrice * 0.1;
    await updateSellerInfo(order.totalPrice - serviceCharge);
  }

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    order,
  });

  async function updateOrder(id, qty) {
    const product = await productModel.findById(id);

    product.stock -= qty;
    product.sold_out += qty;

    await product.save({ validateBeforeSave: false });
  }

  async function updateSellerInfo(amount) {
    const seller = await shopModel.findById(req.seller.id);

    seller.availableBalance = amount;

    await seller.save();
  }
});

//Give refund to user
exports.RefundUser = catchAsync(async (req, res, next) => {
  const order = await orderModel.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order with this id is not found", 404));
  }

  order.status = req.body.status;

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    order,
    message: "Order Refund request successful",
  });
});

//accept the refund ----seller
exports.AcceptRefund = catchAsync(async (req, res, next) => {
  const order = await orderModel.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order with this id is not found", 404));
  }

  order.status = req.body.status;

  await order.save();

  res.status(200).json({
    status: "success",
    message: "Order Refund successfull",
  });

  if (req.body.status === "Refund Success") {
    order.cart.forEach(async (o) => {
      await updateOrder(o._id, o.qty);
    });
  }

  async function updateOrder(id, qty) {
    const product = await productModel.findById(id);

    product.stock += qty;
    product.sold_out -= qty;

    await product.save({ validateBeforeSave: false });
  }
});

exports.getAllOrderAdmin = catchAsync(async (req, res, next) => {
  try {
    const orders = await orderModel.find().sort({
      deliveredAt: -1,
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      orders,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// exports.createSignature = (message) => {
//   const secret = "8gBm/:&EnhH.1/q"; //different in production
//   // Create an HMAC-SHA256 hash
//   const hmac = crypto.createHmac("sha256", secret);
//   hmac.update(message);

//   // Get the digest in base64 format
//   const hashInBase64 = hmac.digest("base64");
//   return hashInBase64;
// };
