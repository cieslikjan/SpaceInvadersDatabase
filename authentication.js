const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

mongoose.connect("mongodb+srv://testUser:test123@cluster0.xngl3.mongodb.net/userDB", { useNewUrlParser: true, useUnifiedTopology:true });

mongoose.connection.on('error', (err) => {
    console.log(err);
   });

mongoose.connection.on('connected', () => console.log('Data Db connected'));   

const app =  express();
const port = 8080;
app.use(express.json({extended:false}));

const UserSchema = new mongoose.Schema({
    username:String,
    password:String
});
const User = mongoose.model("User", UserSchema);
app.listen(port, () => {
    console.log('Authentication service started on port 8080');
});

// app.post("/", (req, res) => {
//     const user = new User(req.body);
//     user.save()
//       .then(item => {
//         res.send("item saved to database");
//       })
//       .catch(err => {
//         res.status(400).send("unable to save to database");
//       });
//   });



//TODO: define salt
 //salting

app.post('/', (req,res) => {
    const accessTokenSecret = '123';
    //Query database for user
    const user = new User(req.body);
    User.findOne({username: user.username}, (err, obj) => console.log(obj));
    
    if(User){   
        const accessStoken = jwt.sign({username : User.username}, accessTokenSecret);
        res.json({
            accessStoken
        });
    }else{
        res.send('Username or password incorrect');
    }
    
});

