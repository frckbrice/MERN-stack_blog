const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    min: 4,
    unique: true,
  },
  fullname: { type: String, required: false },
  password: {
    type: String,
    required: true,
    min: 4,
    unique: true,
  },
  acceptedTerms: {
    type: Boolean,
    defaultValue: false,
  },
});

UserSchema.virtual('url').get(function() {
  return `/${this._id}`
})

const UserModel = model("User", UserSchema);

module.exports = UserModel;
