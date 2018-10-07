let express = require('express');
let app = express();
let port = process.env.port || 5000;
let router = require('./router');
let bodyParser = require('body-parser');
let dotenv = require('dotenv');
let mongoose = require('mongoose');

dotenv.config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', router);

app.listen(port, () => {
    console.log('application listening on port: ' + port);
});

mongoose.Promise = global.Promise;

mongoose.connect(process.env.db, { useNewUrlParser: true })
    .then(() => {
        console.log('Connection established to database');
    }).catch((err) => {
        console.log(err);
        console.log('Error connecting to mongo db');
    });