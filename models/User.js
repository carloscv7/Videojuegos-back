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
        validate: {
            message: "El email ya tiene una cuenta asociada",
            validator: async (email) => {
                const items = await model("User").count({email});
                return items < 1;
            }
        }
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