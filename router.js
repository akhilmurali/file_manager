let express = require("express");
let router = express.Router();
let googleController = require("./controllers/google-controller");
let authController = require("./controllers/authcontroller");
let multer = require("multer");
let upload = multer({ dest: 'uploads/' });

//Login route:
router.post("/login", authController.login);

//Signup route:
router.post("/signup", authController.signup);

//Initiate google OAuth:
router.get("/google/oauth/", authController.auth, googleController.initiateGoogleOAuth);

//Callback handler:
router.get("/google/oauth/callback", googleController.googleOAuthCallback);

//Get Access token:
router.post("/google/oauth/token", authController.auth, googleController.saveGoogleAccessToken);

//Route to list files in root folder:
router.get("/google/files/", authController.auth, googleController.listFilesInGDrive);

//Route to upload files to drive:
router.post("/google/files/upload", authController.auth, upload.single("file"), googleController.uploadAFileToGDrive);

//Route to download files from the drive:
router.get("/google/files/:fileId/", authController.auth, googleController.downloadAFileFromGDrive);

module.exports = router;
