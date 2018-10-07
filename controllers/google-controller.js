const { google } = require("googleapis");
let rp = require("request-promise");
let dotenv = require("dotenv");
let googleToken = require("../models/googleTokenModel");
let jwt = require('jsonwebtoken');
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.google_client_id,
    process.env.google_client_secret,
    process.env.google_callback_url
);

const scopes = ["https://www.googleapis.com/auth/drive"];

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
        res.json({status: 'err', msg: 'missing parameter'});
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
    console.log(tokenData);
    googleToken
        .deleteOne({ user_id: decoded._id })
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
    let decoded = jwt.decode(req.jwt_token, { complete: true });
    let googleToken = getUserAccessToken(decoded._id, res);
    rp.get("https://www.googleapis.com/drive/v3/files", {
        auth: {
            bearer: globalToken
        },
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${googleToken}`
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
};

//File Upload handler:
uploadAFileToGDrive = (req, res) => {
    //File path on server:
    let decoded = jwt.decode(req.jwt_token, { complete: true });
    let googleToken = getUserAccessToken(decoded._id, res);
    let filePath = req.files;
    let contentBody = req.readFileSync(filePath);
    rp.post("https://www.googleapis.com/upload/drive/v3/files", {
        qs: {
            uploadType: "media"
        },
        headers: {
            "Content-Type": "image/jpeg",
            Authorization: `Bearer ${googleToken}`,
            "Content-Length": new Buffer(contentBody).length
        },
        body: contentBody
    })
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            res.json(err);
        });
};

//File download handler:
downloadAFileFromGDrive = (req, res) => {
    let decoded = jwt.decode(req.jwt_token, { complete: true });
    let googleToken = getUserAccessToken(decoded._id, res);
    rp.get(`https://www.googleapis.com/drive/v3/files/${req.params.fileId}?alt=media`, {
        headers: {
            Authorization: `Bearer ${googleToken}`
        }
    }).then((file) => {
        res.json(file);
    })
        .catch(err => {
            res.json(err);
        });
};

function getUserAccessToken(id, res) {
    Token.findOne({ user_id: id })
        .then(token => {
            if (token && token.expiry_date > new Date()) {
                return token.access_token;
            } else {
                res.redirect("/google/oauth");
            }
        })
        .catch(err => {
            res.redirect("/google/oauth");
        });
}

module.exports = {
    initiateGoogleOAuth,
    googleOAuthCallback,
    listFilesInGDrive,
    uploadAFileToGDrive,
    downloadAFileFromGDrive,
    saveGoogleAccessToken
};
