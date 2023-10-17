const mongoose = require("mongoose")
const express = require("express")
const User = mongoose.model("User")
const Role = mongoose.model("Role")
const UserRole = mongoose.model("UserRole")
const router = express.Router()


//for adding a new user

router.post("/addUser", (req, res) => {
    const { first_name, last_name, email, password, phone, code } = req.body;

    // Validate that required fields are provided
    for (let x in req.body) {
        if (!req.body[x]) {
            return res.status(422).json({ error: "Please fill all the fields" });
        }
        if (x == "code" && req.body[x].length != 6) {
            return res.status(422).json({ error: "Code should be of 6 characters" });
        }
    }

    // Check if user with the provided email or phone already exists
    User.findOne({ $or: [{ email }, { phone }] })
        .then(existingUser => {
            if (existingUser) {
                if (existingUser.deleted_at !== null) {
                    // If existing user is deleted, proceed with creating a new user
                    const newUser = new User({
                        first_name,
                        last_name,
                        email,
                        password,
                        phone,
                        code,
                        created_at: new Date(),
                        updated_at: null,
                        deleted_at: null
                    });

                    // Save the new user
                    newUser.save()
                        .then(newUserCreated => {
                            return res.json({ message: "User created successfully", user: newUserCreated });
                        })
                        .catch(error => {
                            console.error("Error:", error);
                            return res.status(500).json({ error: "Error while creating user" });
                        });
                } else {
                    // Existing user with non-null deleted_at, return error
                    return res.status(401).json({ error: "User / Phone number already exists" });
                }
            }

            // If no existing user, create a new user
            const newUser = new User({
                first_name,
                last_name,
                email,
                password,
                phone,
                code,
                created_at: new Date(),
                updated_at: null,
                deleted_at: null
            });

            // Save the new user
            newUser.save()
                .then(newUserCreated => {
                    return res.json({ message: "User created successfully", user: newUserCreated });
                })
                .catch(error => {
                    console.error("Error:", error);
                    return res.status(500).json({ error: "Error while creating user" });
                });
        })
        .catch(error => {
            console.error("Error:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        });
});


//For adding a new role
router.post("/addRole", (req, res) => {
    const { name } = req.body
    if (!name) {
        return res.status(422).json({ error: "Please provide role name" })
    }
    Role.findOne({ name: name.toUpperCase() })
        .then(existedRole => {
            if (existedRole) {
                return res.status(422).json({ error: "Role already exist" })
            }
            // If no existing role, create a new role

            const newRole = new Role({
                name: name.toUpperCase(),
                created_at: new Date(),
                updated_at: null,
            })
            newRole.save()
                .then((newRoleCreated) => {
                    return res.json({ message: "Role created successfully", Role: newRoleCreated })
                }).catch(error => {
                    console.error("Error:", error);
                    return res.status(500).json({ error: "Error while creating Role" });
                });
        }).catch(error => {
            console.error("Error:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        });

})

//for updating the user

router.put("/updateUser", async (req, res) => {
    const { email, password, ...updateFields } = req.body;

    // Validate that email and password are provided
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required for updating" });
    }

    // Ensure at least one field is provided for update
    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: "At least one field is required for updating" });
    }

    // Add updated_at to the updateFields
    updateFields.updated_at = new Date();

    try {
        // Check if the email and password match an existing user
        const existingUser = await User.findOne({ email, password });

        if (!existingUser) {
            return res.status(404).json({ error: "User not found or invalid credentials" });
        }

        // Update the user with the provided fields
        const updatedUser = await User.findOneAndUpdate(
            { email, password },
            { $set: updateFields },
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return res.status(500).json({ error: "Error while updating user" });
        }

        return res.json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});



router.patch("/updateRole", (req, res) => {
    const { name, _id } = req.body;

    if (!name || !_id) {
        return res.status(422).json({ error: "Please fill all the fields" });

    }
    // Validate that _id is a valid ObjectId

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(401).json({ error: "Invalid Role id" });
    }


    Role.findByIdAndUpdate(
        _id,
        { $set: { name: name.toUpperCase(), updated_at: new Date() } },
        { new: true }
    )
        .then(updatedRole => {
            if (!updatedRole) {
                return res.status(401).json({ error: "Invalid Role id" });
            }
            return res.json({ message: "Role updated successfully", role: updatedRole });
        })
        .catch(error => {
            console.error("Error:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        });
});


router.delete("/deleteUser", async (req, res) => {
    const { email, password } = req.body
    try {
        // Check if the email and password match an existing user
        const existingUser = await User.findOne({ email });

        if (!existingUser || password !== existingUser.password || existingUser.deleted_at) {
            return res.status(404).json({ error: "User not found or invalid credentials" });
        }
        // Update the user with the provided fields
        const updatedUser = await User.findOneAndUpdate(
            { email, password },
            { $set: { deleted_at: new Date() } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(500).json({ error: "Error while updating user" });
        }

        return res.json({ message: "User deleted successfully", user: updatedUser });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }

})


router.post("/assignRole", async (req, res) => {
    const { role_id, user_id } = req.body;

    // Check if role_id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(role_id)) {
        return res.status(400).json({ error: "Invalid role_id" });
    }

    // Check if user_id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ error: "Invalid user_id" });
    }

    try {
        // Check if the role is already assigned to the user
        const existingUserRole = await UserRole.findOne({ role_id, user_id });

        if (existingUserRole) {
            return res.status(400).json({ error: "Role is already assigned to the user" });
        }

        // Find the user by user_id and populate the user's data
        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if the user is deleted
        if (user.deleted_at !== null) {
            return res.status(400).json({ error: "Can not assign the role as the user is deleted" });
        }

        // Create a new UserRole document
        const userRole = new UserRole({
            role_id,
            user_id,
        });

        // Save the UserRole document
        await userRole.save();

        return res.json({
            message: "Role assigned successfully",
            user: {
                _id: user._id,
                name: `${user.first_name} ${user.last_name}`,
            },
            role_id,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});



router.get("/usersWithRoles", async (req, res) => {
    try {
        // Find all UserRole documents and populate user and role details
        const userRoles = await UserRole.find().populate("user_id").populate("role_id");

        // Map userRoles to a format that includes user and role details
        const usersWithRoles = userRoles.map((userRole) => {
            return {
                user: {
                    _id: userRole.user_id._id,
                    name: `${userRole.user_id.first_name} ${userRole.user_id.last_name}`,
                    email: userRole.user_id.email,
                },
                role: {
                    _id: userRole.role_id._id,
                    name: userRole.role_id.name,
                },
            };
        });

        return res.json({ usersWithRoles });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});



router.post("/user", async (req, res) => {
    const { userId } = req.body;

    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid userId" });
    }

    try {
        // Find the user by userId
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.deleted_at !== null) {
            return res.status(400).json({ error: "User is deleted" });
        }

        // Find all UserRole documents for the user and populate role details
        const userRoles = await UserRole.find({ user_id: userId }).populate("role_id");

        // Map userRoles to a format that includes role details
        const roles = userRoles.map((userRole) => {
            return {
                _id: userRole.role_id._id,
                name: userRole.role_id.name,
                // Add other role properties as needed
            };
        });

        // Include user details and assigned roles in the response
        return res.json({
            user: {
                _id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                password: user.password,
                phone: user.phone,
                code: user.code,
                created_at: user.created_at,
                updated_at: user.updated_at,
                deleted_at: user.deleted_at,
            },
            roles: roles,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router