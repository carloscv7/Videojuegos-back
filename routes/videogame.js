const express = require('express');
const videogame = require('../models/Videogame');
const router = express.Router();
const Videogame = require("../models/Videogame")
const {veryToken} = require("../utils/auth");

router.post('/create', veryToken, function(req, res, next) {
    const {name, images, description, price} = req.body;
    const _owner = req.user._id;

    Videogame.create({name, images, description, price, _owner})
        .then(videogame =>{
            res.status(201).json({videogame});
        })
        .catch(e=>{
            res.status(400).json({msg: "Algo salio mal", e});
        })
});

router.get('/:id', veryToken, (req, res, next) => {
    const {id} = req.params;

    Videogame.findById(id)
        .then((videogame) =>{
            res.status(200).json({videogame});
        })
        .catch(e=>{
            res.status(400).json({msg:"Algo salio mal", e});
        });
});

router.patch("/:id", veryToken, (req, res, next) =>{
    const {id} = req.params;
    Videogame.findById(id)
        .then((videogame) =>{
            if(videogame._owner === req.user._id){
                Videogame.findByIdAndUpdate(id, req.body, {new:true})
                    .then(videogame=>{
                        res.status(200).json({videogame});
                    })
                    .catch(e=>{
                        res.status(400).json({msg:"Algo salio mal", e})
                    })
            }else{
                res.status(403).json({msg:"No tienes permiso para actualizar el videojuego"});
            }
            
        })
        .catch(e=>{
            res.status(400).json({msg:"Algo salio mal", e})
        });
});

router.delete("/:id", veryToken, (req, res, next) =>{
    const {id} = req.params;
    Videogame.findById(id)
        .then((videogame) =>{
            if(videogame._owner === req.user._id){
                Videogame.findByIdAndRemove(id)
                    .then(videogame=>{
                        res.status(200).json({msg: "Se borro el videojuego", videogame});
                    })
                    .catch(e=>{
                        res.status(400).json({msg:"Algo salio mal", e})
                    });
            }else{
                res.status(403).json({msg:"No tienes permiso para borrar el videojuego"});
            }
        })
        .catch(e=>{
            res.status(400).json({msg:"Algo salio mal", e})
        });
});

module.exports = router;
