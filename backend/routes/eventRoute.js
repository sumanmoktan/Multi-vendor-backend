const express = require("express");
const eventController = require("../controller/eventController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/create-event",
  eventController.uploadEventImages,
  eventController.resizeEventImages,
  eventController.createEvent
);
router.get("/get-all-events", eventController.GetEvent);
router.get("/get-all-events/:id", eventController.GetEventShopId);
router.delete("/delete-shop-event/:id", eventController.DeleteEvent);

//routes for admin
router.get(
  "/admin-all-events",
  isAuthenticated,
  isAdmin("admin"),
  eventController.allEventAdmin
);

module.exports = router;
