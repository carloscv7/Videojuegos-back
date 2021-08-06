const {Schema, model} = require("mongoose");

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, "Debes agregar un usuario"],
        unique: true
    },
    profile_picture: String,
    email: {
        type: String,
        required: [true, "Debes agregar un email"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Debes agregar un password"]
    }

},{
    timestamps: true
}
);

module.exports = model("User", userSchema);