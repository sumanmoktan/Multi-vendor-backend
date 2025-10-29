// const express = require("express");
// const productController = require("../controller/productController");
// // const { upload } = require("../multer");
// const { isAuthenticated, isAdmin } = require("../middleware/auth");

// const router = express.Router();

// router.post(
//   "/create-product",
//   productController.uploadProductImages,
//   productController.resizeProductImages,
//   // upload.array("images"),
//   productController.createProduct
// );

// router.get("/get-all-products", productController.getallproduct);
// router.get("/get-all-products-shop/:id", productController.getAllProduct);
// router.delete("/delete-shop-product/:id", productController.deleteProduct);
// router.patch(
//   "/create-new-review",
//   isAuthenticated,
//   productController.createReview
// );

// //routes for admin
// router.get(
//   "/admin-all-products",
//   isAuthenticated,
//   isAdmin("admin"),
//   productController.getAllProductAdmin
// );

// router.get("/:userId", productController.recommendationsProduct);

// module.exports = router;

const express = require("express");
const productController = require("../controller/productController");
// const { upload } = require("../multer");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/create-product",
  productController.uploadProductImages,
  productController.resizeProductImages,
  // upload.array("images"),
  productController.createProduct
);

router.get("/get-all-products", productController.getallproduct);
router.get("/get-all-products-shop/:id", productController.getAllProduct);
router.delete("/delete-shop-product/:id", productController.deleteProduct);
router.patch(
  "/create-new-review",
  isAuthenticated,
  productController.createReview
);

//routes for admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("admin"),
  productController.getAllProductAdmin
);

// router.get("/:userId", productController.recommendationsProduct);

module.exports = router;
