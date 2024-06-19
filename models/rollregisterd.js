const mongoose = require('mongoose');

const rollSchema= new mongoose.Schema({
    rollno:{
        type: String,
        required: true
    }
});

const Roll=mongoose.model("Roll",rollSchema);


module.exports=Roll;