const mongoose=require("mongoose");

const voteSchema= new mongoose.Schema({
    votePorp:{
        type:String,
        required:true
    },
    options:{
        type:Array,
        required:true
    },
    votedYes:{
        type:Array,
        default:[]
    },
    votedNo:{
        type:Array,
        default:[]
    },
    votingStat:{
        type: Boolean,
        default:false
    }
})

const Vote=mongoose.model("Vote",voteSchema);

module.exports=Vote;