const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dayjs = require('dayjs');
const cookieParser = require('cookie-parser');

// TODO: Generate on startup
// Generate file with secret on startup and load in all servers (?)
const accessTokenSecret = '35gxQ2Mj7W3_H9P=HPAk.Mr?2M4.cu23;pqZ3.t]nFFv_{U)?)EUBwL}y%Fi=gZb';
const refreshTokenSecret = '123';
var refreshTokens = [];

mongoose.connect("mongodb+srv://testUser:test123@cluster0.xngl3.mongodb.net/userDB", { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('error', (err) => {
    console.log(err);
});

mongoose.connection.on('connected', () => console.log('Data Db connected'));

const app = express();
app.use(cors({ credentials: true, origin: 'http://spaceinvaders.servegame.com' }));
app.use(cookieParser());

const port = 8080;
app.use(express.json({ extended: false }));

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    rank: Number,
});

const User = mongoose.model("User", UserSchema);

const GameSchema = new mongoose.Schema({
    player1: String,
    player2: String,
    winner: String,
});

const Game = mongoose.model("Game", GameSchema);

app.listen(port, () => {
    console.log('Authentication service started on port ' + port);
});

const authJWT = (req, res, next) => {
    let token = req.cookies.token;
    let rtoken = req.cookies.rtoken;

    if (!refreshTokens.includes(rtoken)) {
        res.cookie('loggedin', false);
        return res.sendStatus(403);
    }

    if (token) {
        jwt.verify(token, accessTokenSecret, (err, user) => {
            if (err) {
                res.cookie('loggedin', false);
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        })
    } else {
        res.cookie('loggedin', false);
        res.sendStatus(401);
    }
};

app.get('/rank', authJWT, (req, res) => {
    console.log(req.user)

    User.findOne({ username: req.user.username }, (err, obj) => {
        if (obj === null) {
            res.cookie('loggedin', false);
            return res.sendStatus(403);
        }

        let rank = obj.rank;

        Game.find({
            $and: [
                { $or: [{ player1: req.user.username }, { player2: req.user.username }] },
            ]
        }, (err, obj) => {
            res.send({ success: true, msg: { rank: rank, games: obj.length } });
        })
    });
});

app.post('/register', async (req, res) => {
    let findUsername = await User.findOne({ username: req.body.username }).exec();
    if (findUsername !== null) {
        return res.status(400).send({ success: false, msg: "Username nicht einzigartig" });
    }

    let findEmail = await User.findOne({ email: req.body.email }).exec();
    if (findEmail !== null) {
        return res.status(400).send({ success: false, msg: "Email nicht einzigartig" });
    }

    let password = req.body.password;

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hash) {
            let user = { username: req.body.username, password: hash, email: req.body.email, rank: 0 };

            new User(user).save().then(user => {
                return res.status(200).send({ success: true, msg: "user saved to database" });
            }).catch((err) => {
                return res.status(400).send({ success: false, msg: "user not to database" });
            })
        });
    });
});


app.post('/login', (req, res) => {
    User.findOne({ username: req.body.username }, (err, obj) => {

        //check if obj -> catch err in bcrypt.compare
        if (obj === null) {
            return res.sendStatus(401);
        }
        bcrypt.compare(req.body.password, obj.password, function (err, result) {
            if (result) {
                const accessToken = jwt.sign({ username: obj.username }, accessTokenSecret, { expiresIn: '20m' });
                const refreshToken = jwt.sign({ username: obj.username }, refreshTokenSecret);

                refreshTokens.push(refreshToken);

                res.cookie('token', accessToken, {
                    httpOnly: true,
                    expires: dayjs().add(20, 'minutes').toDate()
                });

                res.cookie('rtoken', refreshToken, {
                    httpOnly: true,
                });

                res.cookie('loggedin', true);

                res.cookie('username', obj.username);

                return res.status(200).send({ success: true, msg: "Logged in!" });
            } else {
                return res.status(401).send('Username or password incorrect');
            }
        });
    });
});

app.post('/token', (req, res) => {
    let rtoken = req.cookies.rtoken;

    if (!rtoken) {
        res.cookie('loggedin', false);
        return res.sendStatus(401);
    }

    if (!refreshTokens.includes(rtoken)) {
        res.cookie('loggedin', false);
        return res.sendStatus(403);
    }

    jwt.verify(rtoken, refreshTokenSecret, (err, user) => {
        if (err) {
            res.cookie('loggedin', false);
            return res.sendStatus(403);
        }

        const accessToken = jwt.sign({ username: user.username }, accessTokenSecret, { expiresIn: '20m' });

        res.cookie('token', accessToken, {
            httpOnly: true,
            expires: dayjs().add(20, 'minutes').toDate()
        })

        res.sendStatus(200);
    });
});

app.post('/logout', authJWT, (req, res) => {
    let rtoken = req.cookies.rtoken;
    refreshTokens = refreshTokens.filter(t => t !== rtoken);

    res.cookie('loggedin', false);
    res.send({ success: true, msg: "Logout successful" });
});

