const multer = require("multer");
const sharp = require("sharp");
const User = require("../model/userModel");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsync = require("../middleware/catchAsync");
const path = require("path");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/Email");
const sendToken = require("../utils/jwtToken");
const userModel = require("../model/userModel");

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

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = {
      name: name,
      email: email,
      password: password,
      photo: req.file.filename,
    };
    const newUser = await User.create(user);
    res.status(201).json({
      success: true,
      newUser,
    });
    //  const activationToken = createActivationToken(user);
    //  const activationUrl = `https://localhost:3000/activation/${activationToken}`

    //  try{
    //   await sendMail({
    //       email:user.email,
    //       subject:"Activate your account",
    //       message:`hello ${user.name} please click on the link to your activate account:${activationUrl}`,
    //   });
    //   res.status(201).json({
    //       success:true,
    //       message:`please check your email:-${user.email} to activate your account!`
    //   })
    //  } catch(error){
    //   return next(new ErrorHandler(error.message, 500));
    //  }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
};

// creating activation token
const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATIONSCRETE, {
    expiresIn: "5m",
  });
};

exports.activateUser = catchAsync(async (req, res, next) => {
  try {
    const { activation_token } = req.body;

    const newUser = jwt.verify(activation_token, process.env.ACTIVATIONSCRETE);

    if (!newUser) {
      return next(new ErrorHandler("Invalid token", 400));
    }
    const { name, email, password, avatar } = newUser;

    let user = await User.findOne({ email });

    if (user) {
      return next(new ErrorHandler("User already exists", 400));
    }
    user = await User.create({
      name,
      email,
      avatar,
      password,
    });

    sendToken(user, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.Login = catchAsync(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler("Invalid email or password", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("User doenot exist", 400));
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new ErrorHandler("Invalid Password", 400));
    }

    sendToken(user, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.userDetail = catchAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorHandler("User doesn't exists", 400));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.Logout = catchAsync(async (req, res, next) => {
  try {
    res.cookie("token", null, {
      expries: new Date(Date.now()),
      httpOnly: true,
    });

    res.status(201).json({
      status: "success",
      message: "User Logout successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.updateUserInfo = catchAsync(async (req, res, next) => {
  const { email, password, phoneNumber, name } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("User is not found with this email", 404));
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return next(
      new ErrorHandler("please provide the correct information", 400)
    );
  }
  user.name = name;
  user.email = email;
  user.phoneNumber = phoneNumber;

  await user.save();

  res.status(200).json({
    status: "success",
    user,
  });
});

exports.updateAvatar = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.photo = req.file.filename;
  await user.save();

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

//update user address
exports.updateAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const sameTypeAddress = user.addresses.find(
    (address) => address.addressType === req.body.addressType
  );

  if (sameTypeAddress) {
    return next(
      new ErrorHandler(`${req.body.addressType} address already exists`)
    );
  }
  const existsAddress = user.addresses.find(
    (address) => address._id === req.body._id
  );

  if (existsAddress) {
    Object.assign(existsAddress, req.body);
  } else {
    // add the new address to the array
    user.addresses.push(req.body);
  }
  await user.save();

  res.status(200).json({
    status: "success",
    user,
  });
});

//Delete the user Address
exports.DeleteUserAddress = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const addressId = req.params.id;

  await User.updateOne(
    {
      _id: userId,
    },
    { $pull: { addresses: { _id: addressId } } }
  );

  const user = await User.findById(userId);

  res.status(200).json({ success: true, user });
});

//Update your password or change your password
exports.changePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("password doesnot match to each other", 400));
  }
  user.password = req.body.newPassword;

  await user.save();

  res.status(200).json({
    status: "success",
    message: "password is update successfully",
  });
});

//For admin
exports.getAllUserAdmin = catchAsync(async (req, res, next) => {
  try {
    const users = await userModel.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      users,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.deleteUserAdmin = catchAsync(async (req, res, next) => {
  try {
    const user = await userModel.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new ErrorHandler("User is not available with this id", 400));
    }

    res.status(201).json({
      success: true,
      message: "User deleted successfully!",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
