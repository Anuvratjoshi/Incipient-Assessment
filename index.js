require("dotenv").config()
const mongoose = require("mongoose")
const express = require("express")
const app = express()
const PORT = process.env.PORT || 8080

//model
require("./models/users")
require("./models/roles")
require("./models/userRoles")


app.use(express.json())
app.use(express.urlencoded({ extended: true }));


//routes
app.use(require("./routes/mainRoute"))


mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Successfully connected with DB"))
    .catch(() => console.log("Failed while connecting to db"));

app.listen(PORT, () => {
    console.log(`App is running on PORT : ${PORT}`);
})