const User = require("../models/User");
const Note = require("../models/Note");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");

//@desc get all users
//@route GET /users
//@access Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").lean();
  if (!users?.length) {
    return res.status(400).json({ message: "No user found" });
  }
  res.json({ users });
});
//@desc create a user
//@route POST /users
//@access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body;
  //is all the necessary data available
  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  //Checking for duplicates
  const duplicate = await User.findOne({ username }).lean().exec();
  if (duplicate) {
    return res.status(409).json({ message: "Duplicate Username" });
  }
  //hashing the password
  const hashedPassword = await bcrypt.hash(password, 10); //10 rounds of salt
  const userObject = (!Array.isArray(roles) || !roles.length)
    ? { username, "password": hashedPwd }
    : { username, "password": hashedPwd, roles }

  // Create and store new user 
  const user = await User.create(userObject)
  if (user) {
    res.status(201).json({ message: `New User ${user.username} created` });
  } else {
    res.status(400).json({ message: "Invalid User Data Received" });
  }
});
//@desc update a user
//@route PATCH /users
//@access Private
const updateUser = asyncHandler(async (req, res) => {
  //Data Confirmation
  const { username, password, active, roles, id } = req.body;
  if (
    !username ||
    !id ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }
  //Does the user exist?
  const user = await User.findById(id).exec();
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }
  //Is username already taken?
  const duplicate = await User.findOne({ username }).lean().exec();
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(400).json({ message: "Username already taken" });
  }
  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    user.password = await bcrypt.hash(password, 10);
  }
  const updatedUser = await user.save();
  if (updatedUser) {
    res.status(200).json(`User ${updatedUser.username} updated`);
  } else {
    res.status(400).json(`Invalid user data - failed to update user`);
  }
});
//@desc delete a user
//@route Get /users
//@access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "ID is required" });
  }
  //does the user exist
  const user = await User.findById(id).exec();
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }
  // Does the user still have assigned notes?
  const note = await Note.findOne({ user: id }).lean().exec();
  if (note) {
    return res.status(400).json({ message: "User has assigned notes" });
  }
  const result = await user.deleteOne();
  if (result) {
    res.status(200).json({
      message: `Username ${result.username} with ID ${result._id} deleted`,
    });
  } else {
    res.status(400).json({
      message: `Could not delete the user`,
    });
  }
});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
