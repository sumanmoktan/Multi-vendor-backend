const multer = require("multer");
const sharp = require("sharp");
const catchAsync = require("../middleware/catchAsync");
const ErrorHandler = require("../utils/ErrorHandler");
const eventModel = require("../model/eventModel");
const shopModel = require("../model/shopModel");

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

exports.uploadEventImages = upload.fields([{ name: "images", maxCount: 2 }]);

exports.resizeEventImages = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.images) return next();

  // 2) Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `Event-${Date.now()}-${i + 1}.jpeg.jpeg`;

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
    const event = await eventModel.findByIdAndDelete(req.params.id);

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
