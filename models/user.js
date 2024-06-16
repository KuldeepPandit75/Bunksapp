const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rollno: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    pass: {
        type: String,
        required: true
    },
    logedStat:{
        type: Boolean,
        default: false
    },
    authStat:{
        type: Boolean,
        default: false
    },
    prevChatStat:{
        type:Boolean,
        default:false
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;