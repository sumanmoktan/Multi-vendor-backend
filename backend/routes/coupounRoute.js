const express = require('express');
const coupounController = require('../controller/coupounController');
const {isSeller} = require('../middleware/auth');

const router = express.Router();

router.post('/create-coupon-code', isSeller, coupounController.createCoupon);
router.get('/get-coupon/:id', isSeller, coupounController.getallcoupoun);
router.delete('/delete-coupon/:id', isSeller, coupounController.deletecoupouns);
router.get("/get-coupon-value/:name", coupounController.couponValue);


module.exports = router;