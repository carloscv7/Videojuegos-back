const {Schema, model} = require("mongoose");

const directionSchema = new Schema({
    street: {
        type: String,
        required: true
    },
    numberExt: {
        type: Number,
        required: true
    },
    numberInt: String,
    city: {
        type: String,
        required: true
    },
    postalCode: {
        type: Number,
        required: true
    },
    country: {
        type: String,
        required: true
    }
});

const buyerSchema = new Schema({
    id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    direction: {
        type: directionSchema,
        required: true
    },
    buyAmount: {
        type: Number,
        required: true
    }
  });
  

const videogameSchema = new Schema(
    {
        _owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "El videojuego debe tener un dueño."]
        },
        username: {
            type: String,
            required: [true, "El videojuego debe tener un usuario asociado."]
        },
        name: {
            type: String,
            required: [true, "El videojuego debe tener nombre"]
        },
        description: String,
        images: {
            type: [String],
            required: [true, "Debes agregar por lo menos una imagen"]
        },
        price: {
            type: Number,
            min: [1, "El precio del videojuego es muy bajo"],
            required: [true, "Debes agregar un precio."]
        },
        stock: {
            type: Number,
            min: [0, "El stock no puede ser menor a cero"],
            required: [true, "Debes agregar tu stock."]
        },
        buyers: {
            type: [buyerSchema]
        }
    },
    {
        timestamps: true
    }
);

module.exports = model("Videogame", videogameSchema);