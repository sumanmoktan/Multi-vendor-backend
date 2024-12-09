const express = require("express");
const { isAuthenticated, isAdmin, isSeller } = require("../middleware/auth");
const withdrawController = require("../controller/withdrawController");

const router = express.Router();

router.post(
  "/create-withdraw-request",
  isSeller,
  withdrawController.withdrawAmount
);

//for admin
router.get(
  "/get-all-withdraw-request",
  isAuthenticated,
  isAdmin("admin"),
  withdrawController.withdrawHandle
);

router.put(
  "/update-withdraw-request/:id",
  isAuthenticated,
  isAdmin("admin"),
  withdrawController.updatingWithdraw
);

module.exports = router;
