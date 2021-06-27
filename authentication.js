const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcrypt');

mongoose.connect("mongodb+srv://testUser:test123@cluster0.xngl3.mongodb.net/userDB", { useNewUrlParser: true, useUnifiedTopology:true });

mongoose.connection.on('error', (err) => {
    console.log(err);
   });

mongoose.connection.on('connected', () => console.log('Data Db connected'));   

const app =  express();
app.use(cors());
const port = 8080;
app.use(express.json({extended:false}));

const UserSchema = new mongoose.Schema({
    username:String,
    password:String,
    email:String
});

const User = mongoose.model("User", UserSchema);
app.listen(port, () => {
    console.log('Authentication service started on port 8080');
});

//TODO: Check if username already exists in db.
//TODO: Check if email is already registered. 
app.post('/validateUsername', (req,res) => {
    

});

app.post('/register', (req, res) => {
    let password = req.body.password;

    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            req.body.password = hash;
            const user = new User(req.body);
            user.save()
              .then(user => {
                res.send("user saved to database");
              })
              .catch(err => {
                res.status(400).send("unable to save to database");
              });
        });
      });
});


app.post('/login', (req,res) => {
    const accessTokenSecret = '123';

    User.findOne({username: req.body.username}, (err, obj) => {
        bcrypt.compare(req.body.password, obj.password, function(err, result) {
            if (result) {
                const accessStoken = jwt.sign({username : User.username}, accessTokenSecret);
                res.json({
                    accessStoken
                });
            } else {
                res.send('Username or password incorrect');
            }
          });
    });
    
});

