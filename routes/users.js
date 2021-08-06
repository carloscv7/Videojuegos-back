var express = require('express');
var router = express.Router();

const bcrypt = require("bcrypt");
const User = require("../models/User")
const Videogame = require("../models/Videogame");

const jwt = require("jsonwebtoken");

const {clearRes, veryToken} = require("../utils/auth");

router.post('/signup', (req, res, next) => {
  const {email, username,password, confirmPassword} = req.body;
  
  if(password !== confirmPassword){
    return res.status(403).json({msg: "Las contraseñas no coinciden"});
  }

  bcrypt.hash(password,10)
    .then((hashedPassword)=>{
      const user = {email, password:hashedPassword, username};
      
        User.create(user)
        .then(() => {
          res.status(200).json({msg: "Usuario creado con éxito"});
        })
        .catch(e=>{
          res.status(400).json({msg: "Hubo un error" , e});
        })

    }).catch(()=>{
      res.status(500);
    });


});

router.post('/login', (req, res, next) => {
  const {email, password} = req.body;
  
  User.findOne({email})
    .then((user) =>{
      if(user === null){
        return res.status(404).json({msg: "No existe este correo"});
      }
      bcrypt.compare(password, user.password)
        .then((match) =>{
          if(match){
            const newUser = clearRes(user.toObject())
            const token = jwt.sign({id: user._id}, process.env.SECRET, {
              expiresIn: "1d"
            });

            res.cookie("token", token, {
              expires: new Date(Date.now + 3600000),
              secure: false,
              httpOnly: false
            }).json({user:newUser, code:200});

          }else{
            res.status(401).json({msg: "Contraseña incorrecta"});
          }
        })
    }).catch(error=>{
      res.status(400).json({msg: "Hubo un error", error});
    });

});

router.patch("/update", veryToken, (req, res)=>{
  const {password} = req.body;
  User.findById(req.user._id)
    .then(user=>{
      if(user === null){
        res.status(404).json({msg: "Token invalido"});
      }
      bcrypt.compare(password, user.password)
        .then(match=>{
          if(match){
            const {email, username, newPassword} = req.body;
            if(email !== undefined){
              User.findByIdAndUpdate(user._id, {email}, {new:true})
                .then(user=>{
                  const newUser = clearRes(user.toObject());
                  res.status(200).json({user:newUser});
                }).catch(e=>{
                  res.status(500).json({msg:"No se pudo modificar el correo"});
                })
            }else if(username !== undefined){
              User.findByIdAndUpdate(user._id, {username}, {new:true})
                .then(user=>{
                  const newUser = clearRes(user.toObject());
                  res.status(200).json({user:newUser});
                }).catch(e=>{
                  res.status(500).json({msg:"No se pudo modificar el usuario"});
                })
            }else if(newPassword !== undefined){
              bcrypt.hash(newPassword, 10)
                .then(hashedPassword=>{
                  User.findByIdAndUpdate(user._id, {password: hashedPassword}, {new:true})
                    .then(user=>{
                      const newUser = clearRes(user.toObject());
                      res.status(200).json({user:newUser});
                    }).catch(e=>{
                      res.status(500).json({msg:"No se pudo modificar la contraseña"});
                    })
                }).catch(e=>{
                  console.log("Error al encriptar la contraseña ", e);
                  res.status(500);
                });
            }
          }else{
            res.status(401).json({msg: "Contraseña incorrecta"});
          }
        }).catch(e=>{
          console.log(e);
          res.status(500).json({msg: "Error al comparar contraseñas"});
        });
    }).catch(e=>{
      res.status(404).json({msg: "Token invalido"});
    });
});

router.get("/verifyToken", veryToken, (req, res)=>{
  res.status(200).json({msg: "La sesion esta activa"});
});

router.delete("/deleteAccount", veryToken, (req, res)=>{
  const {password} = req.body;
  
  User.findById(req.user._id)
    .then(user =>{
      if(user === null){
        res.status(404).json({msg: "Token invalido"});
      }
      console.log(password + " " + user.password);
      bcrypt.compare(password, user.password)
        .then(match=>{
          if(match){
            Videogame.find({_owner: req.user._id})
              .then(videogames=>{
                let promiseArr = [];
                for(let i = 0; i < videogames.length; i++){
                  promiseArr[i] = Videogame.findByIdAndDelete(videogames[i]._id);
                  promiseArr[i]
                    .catch(e=>{
                      console.log(e)
                      res.status(500).json({msg: "No se pudo borrar un videojuego", e});
                    });
                }
                Promise.all(promiseArr)
                  .then(()=>{
                    User.findByIdAndDelete(user._id)
                      .then(()=>{
                        res.status(200).json({msg: "Usuario borrado con exito"});
                      }).catch(e=>{
                        console.log(e);
                        res.status(500).json({msg: "No se pudo borrar el usuario", e});
                      });
                  });

              }).catch(e=>{
                console.log(e);
                res.status(500).json({msg: "Error al encontrar videojuegos", e});
              })
          }else{
            res.status(401).json({msg: "Contraseña incorrecta"});
          }
        }).catch(e=>{
          console.log(e);
          res.status(500).json({msg: "Hubo un error al validar la contraseña",e});
        });
    }).catch(e=>{
      res.status(400).json({msg: "Hubo un error", e});
    });
});

router.post("/logout",(req,res)=>{
  res.clearCookie("token").json({msg:"Vuelve pronto"})
});

module.exports = router;
