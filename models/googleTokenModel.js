let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let tokenSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        unique: true
    },
    access_token: {
        type: String,
        required: true,
        trim: true
    },
    expiry_date: {
        type: String,
        required: true
    },
    token_type: {
        type: String,
        required: false
    },
    scope: {
        type: String,
        required: false
    }
});

var Token = mongoose.model('Token', tokenSchema);
module.exports = Token;
