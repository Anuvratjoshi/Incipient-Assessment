const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;
const userRoleSchema = new mongoose.Schema({
    role_id: {
        type: ObjectId,
        ref: "Role"
    },
    user_id: {
        type: ObjectId,
        ref: "User"
    },
});

mongoose.model("UserRole", userRoleSchema);