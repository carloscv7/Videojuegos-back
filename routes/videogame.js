const express = require('express');
const videogame = require('../models/Videogame');
const router = express.Router();
const bcrypt = require("bcrypt");
const Videogame = require("../models/Videogame");
const {veryToken} = require("../utils/auth");
const User = require("../models/User");
const {filterVideogames, cleanVideogames} = require("../utils/videogame");

router.post('/create', veryToken, function(req, res, next) {
    const {name, images, description, price, stock} = req.body;
    const _owner = req.user._id;

    User.findOne({_id: _owner})
        .then(user=>{
            username = user.username;
            Videogame.create({name, images, description, price, _owner, username, stock})
            .then(videogame =>{
                res.status(201).json({videogame: cleanVideogames(videogame)});
            })
            .catch(e=>{
                console.log(e);
                res.status(400).json({msg: "Algo salio mal", e});
            })
        }).catch(e=>{
            res.status(401).json({msg: "El usuario que quiere crear el videojuego no se encontro"});
        });
});

router.get( /^\/user\/search\/(.*)\/(.*)$/, veryToken,function(req, res, next) {
    const name = req.params[0];
    const pagenumber = req.params[1];
    const _owner = req.user._id;

    Videogame.find({name: {$regex: name, $options:"i"}}).skip(20*(pagenumber-1)).limit(20)
      .then(videogames => {
        let cleanAndFilteredData = cleanVideogames(filterVideogames(videogames, _owner));
        res.status(200).json({videogames: cleanAndFilteredData});
      })
      .catch(e=>{
        console.log(e);
      });
  });

router.get( /^\/search\/(.*)\/(.*)$/, function(req, res, next) {
    const name = req.params[0];
    const pagenumber = req.params[1];

    Videogame.find({name: {$regex: name, $options:"i"}}).skip(20*(pagenumber-1)).limit(20)
      .then(videogames => {
        res.status(200).json({videogames: cleanVideogames(videogames)});
      })
      .catch(e=>{
        console.log(e);
      });
  });

router.get('/:id', (req, res, next) => {
    const {id} = req.params;

    Videogame.findById(id)
        .then((videogame) =>{
            res.status(200).json({videogame: cleanVideogames(videogame)});
        })
        .catch(e=>{
            res.status(400).json({msg:"Algo salio mal", e});
        });
});

function editVideogameField(id, field, value, errorMsg, res){
    const updateObj = {};
    updateObj[field] = value;
    Videogame.findByIdAndUpdate(id, updateObj, {new:true})
                    .then(videogame=>{
                        res.status(200).json({videogame: cleanVideogames(videogame)});
                    })
                    .catch(e=>{
                        console.log(e);
                        res.status(500).json({msg:errorMsg})
                    })
}

function searchBuyer(arr, buyerId){
    for(let i = 0; i < arr.length; i++){
        if(arr[i].id === buyerId){
            return i;
        }
    }
    return -1;
}

router.patch("/:id", veryToken, (req, res, next) =>{
    const {id} = req.params;
    Videogame.findById(id)
        .then((videogame) =>{
            if(videogame === null){
                res.status(404).json({msg: "No se encontro el videojuego."});
            }
            if(videogame._owner.toString() === req.user._id.toString()){
                let {description, price, name, images, stock, buyAmount} = req.body;
                if(description !== undefined){
                    editVideogameField(id, "description", description, "No se puede actualizar la descripción.", res);
                }else if(price !== undefined){
                    editVideogameField(id, "price", price, "No se puede actualizar el precio.", res);
                }else if(name !== undefined){
                    editVideogameField(id, "name", name, "No se puede actualizar el nombre.", res);
                }else if(images != undefined){
                    if(Array.isArray(images) && images.length <= 5){
                        editVideogameField(id, "images", images, "No se pueden actualizar las imagenes.", res);
                    }else{
                        res.status(400).json({msg: "Solo se permiten 5 imagenes."});
                    }
                }else if(stock !== undefined){
                    editVideogameField(id, "stock", stock, "No se puede actualizar el stock.", res);
                }else if(buyAmount !== undefined){
                    res.status(400).json({msg:"No puedes comprar tu propio videojuego."});
                }
            }else{
                const {password, buyAmount, direction} = req.body;
                if(password !== undefined && buyAmount !== undefined && direction !== undefined){
                    User.findById(req.user._id)
                    .then(user=>{
                        bcrypt.compare(password, user.password)
                            .then(match=>{
                                if(match){
                                    if(videogame.stock-buyAmount >= 0){
                                        videogame.stock -= buyAmount;
                                        let buyerIndex = searchBuyer(videogame.buyers, user._id);
                                        if(buyerIndex === -1){
                                            videogame.buyers.push({id: user._id, username: user.username, buyAmount, direction});
                                        }else{
                                            videogame.buyers[buyerIndex].buyAmount += buyAmount;
                                        }
                                        Videogame.findByIdAndUpdate(id, {stock: videogame.stock, buyers: videogame.buyers}, {new:true})
                                            .then(videogame=>{
                                                res.status(200).json({videogame: cleanVideogames(videogame)});
                                            }).catch(e=>{
                                                console.log(e);
                                                res.status(500)
                                            });
                                    }else{
                                        res.status(400).json({msg:"No hay suficiente stock."});
                                    }
                                }else{
                                    res.status(401).json({msg:"Contraseña incorrecta."})
                                }
                            }).catch(e=>{
                                console.log(e);
                                res.status(500);
                            })
                    }).catch(e=>{
                        res.status(404).json({msg: "Error encontrando el usuario."});
                    });
                }else{
                    res.status(401).json({msg:"No tienes permiso para actualizar el videojuego"});
                }
                
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
            if(videogame._owner.toString() === req.user._id.toString()){
                Videogame.findByIdAndRemove(id)
                    .then(videogame=>{
                        res.status(200).json({msg: "Se borro el videojuego", videogame: cleanVideogames(videogame)});
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
