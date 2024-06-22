const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    from: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true,
        maxLength: 50,
    },
    room:{
        type: String,
        required: true,
    },
    created_at: {
        type: String,
        required: true
    },
    anonymous:{
        type: Boolean,
        default: false
    }
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;

