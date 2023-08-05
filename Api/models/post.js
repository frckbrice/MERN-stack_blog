const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const PostSchema = new Schema({
  title: String,
  summary: String,
  content: String,
  cover: String,
  created: Boolean,
  created_at: {
    type: Date,
    default: function () {
      if (this.created) {
        return Date.now();
      }
      return null;
    },
  },
  author: { type: Schema.Types.ObjectId, ref: "User" },
  updated: Boolean,
  updated_at: {
    type: Date,
    default: function () {
      if (this.updated) {
        return Date.now();
      }
      return null;
    },
  },
});

const PostModel = model("Post", PostSchema);

module.exports = PostModel;
