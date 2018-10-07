const { google } = require("googleapis");
let rp = require("request-promise");
let dotenv = require("dotenv");
let googleToken = require("../models/googleTokenModel");
let jwt = require('jsonwebtoken');
let fs = require('fs');
let path = require('path');

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.google_client_id,
    process.env.google_client_secret,
    process.env.google_callback_url
);

const scopes = ["https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.appdata",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.metadata",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/drive.photos.readonly",
    "https://www.googleapis.com/auth/drive.readonly"];

initiateGoogleOAuth = (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: "online",
        // If you only need one scope you can pass it as a string
        scope: scopes
    });
    res.redirect(url);
};

googleOAuthCallback = (req, res) => {
    if (req.query.code) {
        res.json({ code: req.query.code });
    } else {
        res.json({ code: null });
    }
}

saveGoogleAccessToken = async (req, res) => {
    if (!req.query.code) {
        res.json({ status: 'err', msg: 'missing parameter' });
    }
    const { tokens } = await oauth2Client.getToken(req.query.code);
    console.log(tokens);
    oauth2Client.setCredentials(tokens);
    //Store token in datastore:
    var decoded = jwt.decode(req.query.jwt_token, { complete: false });
    console.log(decoded);
    let uid = decoded.id;
    let tokenData = {
        "user_id": uid,
        "access_token": tokens.access_token,
        "expiry_date": tokens.expiry_date,
        "token_type": tokens.token_type,
        "scope": tokens.scope
    };
    googleToken
        .deleteOne({ user_id: decoded.id })
        .then(() => {
            googleToken
                .create(tokenData)
                .then(token => {
                    res.json({ status: "ok", date: token.expiry_date });
                })
                .catch(err => {
                    res.json({ status: "err", err });
                });
        })
        .catch(err => {
            res.json({ status: "err", err });
        });
};

listFilesInGDrive = (req, res) => {
    let decoded = jwt.decode(req.query.jwt_token, { complete: false });
    googleToken.findOne({ user_id: decoded.id })
        .then(token => {
            console.log(token);
            if (token && token.expiry_date > new Date()) {
                rp.get("https://www.googleapis.com/drive/v3/files", {
                    auth: {
                        bearer: token.access_token
                    },
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token.access_token}`
                    },
                    qs: {
                        pageSize: 5
                    }
                })
                    .then(results => {
                        res.json(results);
                    })
                    .catch(err => {
                        res.json(err);
                    });
            } else {
                res.redirect(`/google/oauth?jwt_token=${req.query.jwt_token}`);
            }
        })
        .catch(err => {
            res.redirect(`/google/oauth?jwt_token=${req.query.jwt_token}`);
        });
};

//File Upload handler:
uploadAFileToGDrive = (req, res) => {
    //File path on server:
    let decoded = jwt.decode(req.query.jwt_token, { complete: false });
    let buffer = fs.readFileSync(path.resolve(__dirname, `../uploads/${req.file.filename}`));
    googleToken.findOne({ user_id: decoded.id })
        .then((token) => {
            if (token.expiry_date > new Date() && token) {
                rp.post("https://www.googleapis.com/upload/drive/v3/files?uploadType=media", {
                    headers: {
                        "Authorization": `Bearer ${token.access_token}`,
                        "Content-Type": req.file.mimetype,
                        "Content-Length": req.file.size
                    },
                    body: buffer
                }).then(result => {
                    console.log(result);
                    res.json(result);
                }).catch(err => {
                    res.json(err);
                });
            }else{
                res.json({status: 'err', msg:'redo oauth'});
            }
        })
        .catch((err) => {
            res.json(err);
        });
};

//File download handler:
downloadAFileFromGDrive = (req, res) => {
    let decoded = jwt.decode(req.query.jwt_token, { complete: false });
    googleToken.findOne({ user_id: decoded.id })
        .then(token => {
            if (token && token.expiry_date > new Date()) {
                rp.get(`https://www.googleapis.com/drive/v3/files/${req.params.fileId}?fields=webContentLink`, {
                    headers: {
                        Authorization: `Bearer ${token.access_token}`
                    }
                }).then((fileData) => {
                    res.redirect(JSON.parse(fileData).webContentLink);
                }).catch(err => {
                    res.json(err);
                });
            } else {
                res.redirect(`/google/oauth?jwt_token=${req.query.jwt_token}`);
            }
        })
        .catch((err) => {
            res.redirect(`/google/oauth?jwt_token=${req.query.jwt_token}`);
        });
};

module.exports = { initiateGoogleOAuth, googleOAuthCallback, listFilesInGDrive, uploadAFileToGDrive, downloadAFileFromGDrive, saveGoogleAccessToken };
