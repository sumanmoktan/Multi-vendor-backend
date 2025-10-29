// const multer = require("multer");
// const sharp = require("sharp");
// const catchAsync = require("../middleware/catchAsync");
// const ErrorHandler = require("../utils/ErrorHandler");
// const eventModel = require("../model/eventModel");
// const shopModel = require("../model/shopModel");

// const multerStorage = multer.memoryStorage();

// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith("image")) {
//     cb(null, true);
//   } else {
//     cb(new appError("Not an image! Please upload only images.", 400), false);
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// });

// exports.uploadEventImages = upload.fields([{ name: "images", maxCount: 2 }]);

// exports.resizeEventImages = catchAsync(async (req, res, next) => {
//   if (!req.files || !req.files.images) return next();

//   // 2) Images
//   req.body.images = [];

//   await Promise.all(
//     req.files.images.map(async (file, i) => {
//       const filename = `Event-${Date.now()}-${i + 1}.jpeg.jpeg`;

//       await sharp(file.buffer)
//         .resize(2000, 1333)
//         .toFormat("jpeg")
//         .jpeg({ quality: 90 })
//         .toFile(`public/img/product/${filename}`);

//       req.body.images.push(filename);
//     })
//   );
//   next();
// });

// exports.createEvent = catchAsync(async (req, res, next) => {
//   //   try {
//   //     const shopId = req.body.shopId;
//   //     const shop = await shopModel.findById(shopId);

//   //     if (!shop) {
//   //       return next(new ErrorHandler("Shop Id is invalid", 400));
//   //     } else {
//   //       const productData = req.body;
//   //       productData.shop = shop;

//   //       const event = await eventModel.create(productData);

//   //       res.status(201).json({
//   //         success: true,
//   //         event,
//   //       });
//   //     }
//   //   } catch (error) {
//   //     return next(new ErrorHandler(error, 400));
//   //   }
//   // });
//   try {
//     const shopId = req.body.shopId;
//     const shop = await shopModel.findById(shopId);

//     if (!shop) {
//       return next(new ErrorHandler("Shop Id is invalid", 400));
//     } else {
//       const productData = { ...req.body, tags: JSON.parse(req.body.tags) }; // Parse tags from JSON

//       productData.shop = shop;

//       const event = await eventModel.create(productData);

//       res.status(201).json({
//         success: true,
//         event,
//       });
//     }
//   } catch (error) {
//     return next(new ErrorHandler(error, 400));
//   }
// });

// exports.GetEvent = catchAsync(async (req, res, next) => {
//   try {
//     const events = await eventModel.find();

//     res.status(200).json({
//       status: "success",
//       result: events.lengths,
//       events,
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error, 400));
//   }
// });

// exports.GetEventShopId = catchAsync(async (req, res, next) => {
//   try {
//     const events = await eventModel.find({ shopId: req.params.id });

//     res.status(201).json({
//       success: true,
//       events,
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error, 400));
//   }
// });

// exports.DeleteEvent = catchAsync(async (req, res, next) => {
//   try {
//     const event = await eventModel.findByIdAndDelete(req.params.id);

//     if (!event) {
//       return next(new ErrorHandler("evnet is not found with this id", 404));
//     }

//     // for (let i = 0; 1 < product.images.length; i++) {
//     //   const result = await cloudinary.v2.uploader.destroy(
//     //     event.images[i].public_id
//     //   );
//     // }

//     res.status(201).json({
//       success: true,
//       message: "Event Deleted successfully!",
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error, 400));
//   }
// });

// //all events for admin
// exports.allEventAdmin = catchAsync(async (req, res, next) => {
//   try {
//     const events = await eventModel.find().sort({
//       createdAt: -1,
//     });
//     res.status(201).json({
//       success: true,
//       events,
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 500));
//   }
// });

const multer = require("multer");
const sharp = require("sharp");
const catchAsync = require("../middleware/catchAsync");
const ErrorHandler = require("../utils/ErrorHandler");
const eventModel = require("../model/eventModel");
const shopModel = require("../model/shopModel");
const cloudinary = require("cloudinary").v2;

// Configure multer for memory storage
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(
      new ErrorHandler("Not an image! Please upload only images.", 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

exports.uploadEventImages = upload.fields([{ name: "images", maxCount: 3 }]);

exports.resizeEventImages = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.images) return next();

  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      try {
        // Resize and format image with Sharp
        const resizedImageBuffer = await sharp(file.buffer)
          .resize(2000, 1333, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toBuffer();

        // Convert buffer to base64 for Cloudinary upload
        const base64Image = resizedImageBuffer.toString("base64");
        const dataURI = `data:image/jpeg;base64,${base64Image}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "events",
          public_id: `event-${Date.now()}-${i + 1}`,
        });

        req.body.images.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (error) {
        console.error("Image processing/upload failed:", error);
        return next(new ErrorHandler("Image processing failed", 500));
      }
    })
  );

  next();
});

// const multerStorage = multer.memoryStorage();

// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith("image")) {
//     cb(null, true);
//   } else {
//     cb(new appError("Not an image! Please upload only images.", 400), false);
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// });

// exports.uploadEventImages = upload.fields([{ name: "images", maxCount: 2 }]);

// exports.resizeEventImages = catchAsync(async (req, res, next) => {
//   if (!req.files || !req.files.images) return next();

//   // 2) Images
//   req.body.images = [];

//   await Promise.all(
//     req.files.images.map(async (file, i) => {
//       const filename = `Event-${Date.now()}-${i + 1}.jpeg.jpeg`;

//       await sharp(file.buffer)
//         .resize(2000, 1333)
//         .toFormat("jpeg")
//         .jpeg({ quality: 90 })
//         .toFile(`public/img/product/${filename}`);

//       req.body.images.push(filename);
//     })
//   );
//   next();
// });

exports.createEvent = catchAsync(async (req, res, next) => {
  //   try {
  //     const shopId = req.body.shopId;
  //     const shop = await shopModel.findById(shopId);

  //     if (!shop) {
  //       return next(new ErrorHandler("Shop Id is invalid", 400));
  //     } else {
  //       const productData = req.body;
  //       productData.shop = shop;

  //       const event = await eventModel.create(productData);

  //       res.status(201).json({
  //         success: true,
  //         event,
  //       });
  //     }
  //   } catch (error) {
  //     return next(new ErrorHandler(error, 400));
  //   }
  // });
  try {
    const shopId = req.body.shopId;
    const shop = await shopModel.findById(shopId);

    if (!shop) {
      return next(new ErrorHandler("Shop Id is invalid", 400));
    } else {
      const productData = { ...req.body, tags: JSON.parse(req.body.tags) }; // Parse tags from JSON

      productData.shop = shop;

      const event = await eventModel.create(productData);

      res.status(201).json({
        success: true,
        event,
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

exports.GetEvent = catchAsync(async (req, res, next) => {
  try {
    const events = await eventModel.find();

    res.status(200).json({
      status: "success",
      result: events.lengths,
      events,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

exports.GetEventShopId = catchAsync(async (req, res, next) => {
  try {
    const events = await eventModel.find({ shopId: req.params.id });

    res.status(201).json({
      success: true,
      events,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

exports.DeleteEvent = catchAsync(async (req, res, next) => {
  try {
    const event = await eventModel.findById(req.params.id);

    if (!event) {
      return next(new ErrorHandler("event with this ID was not found", 404));
    }
    if (event.images && event.images.length > 0) {
      await Promise.all(
        event.images.map(async (image) => {
          try {
            await cloudinary.uploader.destroy(image.public_id);
          } catch (err) {
            console.error(
              `Cloudinary deletion failed for ${image.public_id}:`,
              err
            );
          }
        })
      );
    }
    await eventModel.findByIdAndDelete(req.params.id);

    if (!event) {
      return next(new ErrorHandler("evnet is not found with this id", 404));
    }

    // for (let i = 0; 1 < product.images.length; i++) {
    //   const result = await cloudinary.v2.uploader.destroy(
    //     event.images[i].public_id
    //   );
    // }

    res.status(201).json({
      success: true,
      message: "Event Deleted successfully!",
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

//all events for admin
exports.allEventAdmin = catchAsync(async (req, res, next) => {
  try {
    const events = await eventModel.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      events,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
