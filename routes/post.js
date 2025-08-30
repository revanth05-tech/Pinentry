const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  postText: {
    type: String,
    required: [true, "Post text is required"],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"   // references User collection
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model("Post", postSchema);
