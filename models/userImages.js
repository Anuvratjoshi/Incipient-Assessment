const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const userImages = new mongoose.Schema({
    user_id: {
        type: ObjectId,
        ref: "User"
    },
    images: {
        type: String,
    }
})

mongoose.model("userImage", userImages)