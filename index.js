let express = require('express');
let app = express();
let port = process.env.port || 5000;
let router = require('./router');
let bodyParser = require('body-parser');
let dotenv = require('dotenv');

dotenv.config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/', router);

app.listen(port, ()=>{
    console.log('application listening on port: ' + port);
});