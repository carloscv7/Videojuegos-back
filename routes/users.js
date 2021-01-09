var express = require('express');
var router = express.Router();

const bcrypt = require("bcrypt");
const User = require("../models/User")
const jwt = require("jsonwebtoken");

const {clearRes} = require("../utils/auth");

router.post('/signup', (req, res, next) => {
  const {email, password, confirmPassword} = req.body;
  
  if(password !== confirmPassword){
    return res.status(403).json({msg: "Las contraseñas no coinciden"});
  }

  bcrypt.hash(password,10)
    .then((hashedPassword)=>{
      const user = {email, password:hashedPassword};
      let username = email.split("@")[0];
      let usernameNum = 1;
      User.find({username})
        .then(users => {
          if(users !== null){
            usernameNum += users.length;
          }
          username += usernameNum;
          user.username = username;
          User.create(user)
          .then(() => {
            res.status(200).json({msg: "Usuario creado con éxito"});
          })
          .catch(e=>{
            res.status(400).json({msg: "Hubo un error" , e});
          })
        })
        .catch(e=>{
          console.log("Hubo un error", e);
        })

      
    })

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
              expires: new Date(Date.now + 86400000),
              secure: false,
              httpOnly: true
            }).json({user:newUser, code:200});

          }else{
            res.status(401).json({msg: "No es tu contraseña"});
          }
        })
    }).catch(error=>{
      res.status(400).json({msg: "Hubo un error", error});
    });

});

router.post("/logout",(req,res)=>{
  res.clearCookie("token").json({msg:"Vuelve pronto"})
});

module.exports = router;
