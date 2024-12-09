const multer = require("multer");
const sharp = require("sharp");
const productModel = require("../model/productModel");
const shopModel = require("../model/shopModel");
const orderModel = require("../model/orderModel");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsync = require("../middleware/catchAsync");
const mongoose = require("mongoose");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new appError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadProductImages = upload.fields([{ name: "images", maxCount: 3 }]);

exports.resizeProductImages = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.images) return next();

  // 2) Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `product-${Date.now()}-${i + 1}.jpeg.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/product/${filename}`);

      req.body.images.push(filename);
    })
  );
  next();
});

exports.createProduct = catchAsync(async (req, res, next) => {
  const shopId = req.body.shopId;

  // Find the shop based on the provided shopId
  const shop = await shopModel.findById(shopId);

  if (!shop) {
    return next(new ErrorHandler("Shop with the provided ID is invalid", 400));
  } else {
    // Create a new product object with the provided data
    const productData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      tags: req.body.tags,
      images: req.body.images,
      originalPrice: req.body.originalPrice,
      discountPrice: req.body.discountPrice,
      stock: req.body.stock,
      shopId: shopId, // Assign the shopId
      shop: shop, // Assign the shop object
    };

    // Create the product in the database
    const product = await productModel.create(productData);

    res.status(201).json({
      status: "success",
      product,
    });
  }
});

exports.getAllProduct = catchAsync(async (req, res, next) => {
  try {
    const products = await productModel.find({ shopId: req.params.id });

    res.status(200).json({
      status: "success",
      products,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  try {
    const product = await productModel.findByIdAndDelete(req.params.id);

    if (!product) {
      return next(new ErrorHandler("product with this id is not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Delete successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

exports.getallproduct = catchAsync(async (req, res, next) => {
  const products = await productModel.find();

  res.status(200).json({
    status: "success",
    result: products.length,
    products,
  });
});

//review for product
exports.createReview = catchAsync(async (req, res, next) => {
  const { user, rating, comment, productId, orderId } = req.body;

  const product = await productModel.findById(productId);

  const review = {
    user,
    rating,
    comment,
    productId,
  };

  const isReviewed = product.reviews.find(
    (rev) => rev.user._id === req.user._id
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user._id === req.user._id) {
        (rev.rating = rating), (rev.comment = comment), (rev.user = user);
      }
    });
  } else {
    product.reviews.push(review);
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  await orderModel.findByIdAndUpdate(
    orderId,
    { $set: { "cart.$[elem].isReviewed": true } },
    { arrayFilters: [{ "elem._id": productId }], new: true }
  );

  res.status(200).json({
    success: true,
    message: "Reviwed succesfully!",
  });
});

//all product for admin
exports.getAllProductAdmin = catchAsync(async (req, res, next) => {
  try {
    const products = await productModel.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      products,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

//Function for recommendation algorithm

exports.recommendationsProduct = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Fetch all products and their reviews
    const products = await productModel.find({}, { reviews: 1 });
    console.log("Fetched products:", products);

    if (!products.length) {
      return res.status(200).json({
        success: true,
        message: "No products available for recommendations",
        data: [],
      });
    }

    // Step 1: Build userRatings
    const userRatings = {};
    products.forEach((product) => {
      console.log(`Processing Product ID: ${product._id}`);
      product.reviews.forEach((review, index) => {
        console.log(`  Review ${index}:`, review);

        if (!review.user || !review.user._id) {
          console.warn(
            `  Review ${index} missing 'user' or 'user._id':`,
            review
          );
        } else if (!review.rating) {
          console.warn(`  Review ${index} missing 'rating':`, review);
        } else {
          const userIdString = review.user._id.toString(); // Convert to string
          if (!userRatings[userIdString]) {
            userRatings[userIdString] = {};
          }
          userRatings[userIdString][product._id.toString()] = review.rating; // Convert product ID to string
        }
      });
    });
    console.log("User Ratings Object:", userRatings);
    console.log("Requested User ID:", userId);

    console.log("Final User Ratings:", userRatings);

    // Step 2: Build productRatings
    const productRatings = {};
    Object.keys(userRatings).forEach((user) => {
      Object.entries(userRatings[user]).forEach(([productId, rating]) => {
        if (!productRatings[productId]) {
          productRatings[productId] = {};
        }
        productRatings[productId][user] = rating;
      });
    });
    console.log("Product Ratings:", productRatings);

    // Step 3: Calculate similarityMatrix
    const productsList = Object.keys(productRatings);
    const similarityMatrix = {};

    productsList.forEach((productA) => {
      similarityMatrix[productA] = {};
      productsList.forEach((productB) => {
        if (productA === productB) {
          similarityMatrix[productA][productB] = 1;
        } else {
          const ratingsA = productRatings[productA];
          const ratingsB = productRatings[productB];
          const commonUsers = Object.keys(ratingsA).filter(
            (user) => ratingsB[user]
          );

          if (commonUsers.length === 0) {
            similarityMatrix[productA][productB] = 0;
          } else {
            const dotProduct = commonUsers.reduce(
              (sum, user) => sum + ratingsA[user] * ratingsB[user],
              0
            );
            const magnitudeA = Math.sqrt(
              commonUsers.reduce((sum, user) => sum + ratingsA[user] ** 2, 0)
            );
            const magnitudeB = Math.sqrt(
              commonUsers.reduce((sum, user) => sum + ratingsB[user] ** 2, 0)
            );
            similarityMatrix[productA][productB] =
              dotProduct / (magnitudeA * magnitudeB);
          }
        }
      });
    });
    console.log("Similarity Matrix:", similarityMatrix);

    // Step 4: Calculate scores for user
    const userRatedProducts = userRatings[userId] || {};
    console.log("User Rated Products:", userRatedProducts);

    if (!Object.keys(userRatedProducts).length) {
      return res.status(200).json({
        success: true,
        message: "User has not rated any products",
        data: [],
      });
    }

    const scores = {};
    Object.keys(userRatedProducts).forEach((productId) => {
      const userRating = userRatedProducts[productId];

      Object.keys(similarityMatrix[productId]).forEach((otherProductId) => {
        if (!userRatedProducts[otherProductId]) {
          scores[otherProductId] =
            (scores[otherProductId] || 0) +
            similarityMatrix[productId][otherProductId] * userRating;
        }
      });
    });
    console.log("Scores:", scores);

    // Step 5: Generate recommendations
    const recommendations = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([productId]) => productId);
    console.log("Recommendations:", recommendations);

    if (!recommendations.length) {
      return res.status(200).json({
        success: true,
        message: "No recommendations available",
        data: [],
      });
    }

    const recommendedProducts = await productModel.find({
      _id: { $in: recommendations },
    });

    return res.status(200).json({
      success: true,
      data: recommendedProducts,
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to generate recommendations",
      error: error.message,
    });
  }
});
