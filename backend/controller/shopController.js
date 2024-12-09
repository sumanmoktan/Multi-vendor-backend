const multer = require("multer");
const sharp = require("sharp");
const shopModel = require("../model/shopModel");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsync = require("../middleware/catchAsync");
const sendShopToken = require("../utils/sellerToken");

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

exports.uploadShopPhoto = upload.single("avatar");

exports.resizeShopPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `shops-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/shops/${req.file.filename}`);

  next();
});

exports.createShop = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const selleremail = await shopModel.findOne({ email });

  if (selleremail) {
    return next(new ErrorHandler("user already exist", 400));
  }

  const seller = await shopModel.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    avatar: req.file.filename,
    zipCode: req.body.zipCode,
    address: req.body.address,
    phoneNumber: req.body.phoneNumber,
  });

  sendShopToken(seller, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please provide the all fields!", 400));
  }

  const user = await shopModel.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("User doesn't exists!", 400));
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return next(
      new ErrorHandler("Please provide the correct information", 400)
    );
  }
  sendShopToken(user, 201, res);
});

exports.getSeller = catchAsync(async (req, res, next) => {
  const seller = await shopModel.findById(req.seller._id);
  if (!seller) {
    return next(new ErrorHandler("seller is not find with this id", 404));
  }

  res.status(200).json({
    status: "success",
    seller,
  });
});

//get all information of shop
exports.shopInfo = catchAsync(async (req, res, next) => {
  try {
    const shop = await shopModel.findById(req.params.id);

    res.status(200).json({
      status: "success",
      shop,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
});

exports.logout = catchAsync(async (req, res, next) => {
  try {
    res.cookie("seller_token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      // sameSite: "none",
      // secure: true,
    });
    res.status(201).json({
      success: true,
      message: "Log out successful!",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

//update shop profile picture
exports.UploadShopProfile = catchAsync(async (req, res, next) => {
  const seller = await shopModel.findById(req.seller._id);

  if (!seller) {
    return next(new ErrorHandler("Seller not found with this id", 404));
  }

  seller.avatar = req.file.filename;
  await seller.save();

  res.status(200).json({
    status: "success",
    data: {
      seller,
    },
  });
});

//update seller info
exports.updateSellerInfo = catchAsync(async (req, res, next) => {
  const { name, description, address, phoneNumber, zipCode } = req.body;

  const shop = await shopModel.findOne(req.seller._id);

  if (!shop) {
    return next(new ErrorHandler("User not found", 400));
  }

  shop.name = name;
  shop.description = description;
  shop.address = address;
  shop.phoneNumber = phoneNumber;
  shop.zipCode = zipCode;

  await shop.save();

  res.status(201).json({
    success: true,
    shop,
  });
});

//all seller for admin
exports.getAllSellerAdmin = catchAsync(async (req, res, next) => {
  try {
    const sellers = await shopModel.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      sellers,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.deleteSeller = catchAsync(async (req, res, next) => {
  try {
    const seller = await shopModel.findById(req.params.id);

    if (!seller) {
      return next(
        new ErrorHandler("Seller is not available with this id", 400)
      );
    }

    await shopModel.findByIdAndDelete(req.params.id);

    res.status(201).json({
      success: true,
      message: "Seller deleted successfully!",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// update seller withdraw methods --- sellers
exports.updatingWithdrawMethod = catchAsync(async (req, res, next) => {
  try {
    const { withdrawMethod } = req.body;

    const seller = await shopModel.findByIdAndUpdate(req.seller._id, {
      withdrawMethod,
    });

    res.status(201).json({
      success: true,
      seller,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.DeleteWithdrawMethod = catchAsync(async (req, res, next) => {
  try {
    const seller = await shopModel.findByIdAndDelete(req.seller._id);

    if (!seller) {
      return next(new ErrorHandler("Seller not found with this id", 400));
    };

    res.status(201).json({
      success: true,
      seller,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
