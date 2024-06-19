const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    student:{
        type: Boolean,
        required: true,
        default: false
    },
    rollno: {
        type: String
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