const express = require("express");
const orderController = require("../controller/orderController");
const { isSeller, isAuthenticated } = require("../middleware/auth");

const router = express.Router();

router.post("/create-order", orderController.createOrder);
router.get("/get-all-orders/:userId", orderController.UserOder);
router.get("/get-seller-all-orders/:shopId", orderController.SellerOrder);
router.patch(
  "/update-order-status/:id",
  isSeller,
  orderController.updateStatus
);
router.patch("/order-refund/:id", orderController.RefundUser);
router.patch(
  "/order-refund-success/:id",
  isSeller,
  orderController.AcceptRefund
);
router.get(
  "/admin-all-orders",
  isAuthenticated,
  orderController.getAllOrderAdmin
);

module.exports = router;
