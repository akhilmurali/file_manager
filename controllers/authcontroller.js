let User = require('../models/userModel');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

//-------------------------------Auth MiddleWare-------------------//
const auth = (req, res, next) => {
    let token = req.header('x-access-token') || req.query.jwt_token;
    req.token = token;
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            err.status = 401;
            err.message = 'No auth token provided';
            res.json({err});
        } else {
            next();
        }
    });
}

//--------------------------------SignUp ----------------------------------------//
const signup = function (req, res) {
    var hashedPassword = bcrypt.hashSync(req.body.password, 8);
    var userData = {
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
    }

    User.create(userData)
        .then(function (user) {
            // create a token
            var token = jwt.sign({
                id: user._id
            }, process.env.JWT_SECRET, {
                expiresIn: 86400 // expires in 24 hours
            });
            res.status(200).send({
                auth: true,
                token: token
            });
        })
        .catch((err) => {
            console.log(err);
            res.json({
                result: 'error'
            });
        });
}

//--------------------------------Login ------------------------------------------//
const login = function(req, res){
    User.findOne({
        email: req.body.email
    }, function (err, user) {
        if (err) return res.status(500).send('Error on the server.');
        if (!user) return res.status(404).send('User not found');
        var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
        if (!passwordIsValid) return res.status(401).send({
            auth: false,
            token: null
        });
        var token = jwt.sign({
            id: user._id
        }, process.env.JWT_SECRET, {
            expiresIn: 86400
        });
        res.status(200).send({
            auth: true,
            token: token
        });
    });
}

module.exports = {auth, login, signup};
