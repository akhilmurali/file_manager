let express = require('express');
let router = express.Router();
let Dropbox = require('dropbox').Dropbox;
let DropboxTeam = require('dropbox').DropboxTeam;
let controller = require('./controller');

router.get('/', (req, res) => {
    res.send({ msg: 'Welcome to unified file manager', status: 'ok' });
});

//Initiate google OAuth:
router.get('/google/oauth/', controller.initiateGoogleOAuth);

router.get('/google/oauth/callback', controller.googleOAuthCallback);

router.get('/google/files', controller.listFilesInGDrive);

module.exports = router;