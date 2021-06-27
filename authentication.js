const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dayjs = require('dayjs');

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

app.post('/register', (req, res) => {
    let findUsername = User.findOne({username: req.body.username});
    if (findUsername !== null) {
        return res.status(400).send({success: false, msg: "Username nicht einzigartig"});
    }
    
    let findEmail = User.findOne({email: req.body.email});
    if (findEmail !== null) {
        return res.status(400).send({success: false, msg: "Email nicht einzigartig"});
    }
    
    let password = req.body.password;

    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            req.body.password = hash;
            new User(req.body).save().then(user => {
                return res.status(200).send({success: true, msg: "user saved to database"});
            }).catch((err) => {
                return res.status(400).send({success: false, msg: "user not to database"});
            })
        });
    });
});


app.post('/login', (req,res) => {
    const accessTokenSecret = '123';

    User.findOne({username: req.body.username}, (err, obj) => {
        bcrypt.compare(req.body.password, obj.password, function(err, result) {
            if (result) {
                const accessStoken = jwt.sign({username : User.username}, accessTokenSecret);
                res.cookie('token', accessStoken, {
                    httpOnly: true,
                    expires: dayjs().add(20, 'minutes').toDate()
                })
                return res.status(200).end();
            } else {
                return res.status(400).send('Username or password incorrect');
            }
        });
    });
    
});

