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
    created_at: {
        type: Date,
        required: true
    }
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;

