const mongoose = require("mongoose");
const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    created_at: {
        type: String,
    },
    updated_at: {
        type: String,
    },
})

mongoose.model("Role", roleSchema)