require('dotenv').config();
const mongoose = require('mongoose');
const express = require("express");
const app = express();
const path = require("path");
const Chat = require("./models/chat.js");
const User = require("./models/user.js");
const Vote = require("./models/vote.js");
const Roll = require("./models/rollregisterd.js");
const methodOverride = require("method-override");
var jwt = require("jsonwebtoken");
const secretKeyJWT="kuldeepwebd";


const { Server } = require("socket.io");
const { createServer } = require("node:http");
const cookieParser = require('cookie-parser');
const server = createServer(app);
const io = new Server(server,{
    connectionStateRecovery: {}
});

app.use(methodOverride("_method"))

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const port = 8080;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "public")));

main()
    .then(() => {
        console.log("connection succeded!")
    })
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.SECRET_KEY);
}

app.get("/", (req, res) => {
    res.send("root is working");
});

app.get("/bunksapp/signup",(req,res)=>{
    res.render("signup.ejs")
})

app.post("/bunksapp/signup",async(req,res)=>{
    try{
        let { name,userPorp,roll,email,password } = req.body;
        let userStat;
        if(userPorp=="student"){
            userStat=true;
        }else{
            userStat=false;
        };

        if(userStat){
            let rollPresence= await Roll.find({rollno:roll});
            if(rollPresence.length==0){
                res.send("invalid roll no")
            }else{
                let delStat= await Roll.deleteOne({rollno:roll});
                console.log(delStat);
                let newUser = new User({
                    name: name.toLowerCase(),
                    student: userStat,
                    rollno: roll.toLowerCase(),
                    email: email.toLowerCase(),
                    pass: password
                });
                newUser.save()
                    .catch((err) => {
                        console.log(err);
                    });    
                res.redirect("/bunksapp/login");
                
            };
        }else{
            let newUser = new User({
                name: name.toLowerCase().trim(),
                student: userStat,
                email: email.toLowerCase().trim(),
                pass: password.trim()
            });
            newUser.save()
                .catch((err) => {
                    console.log(err);
                });    
            res.redirect("/bunksapp/login");
        }

        }catch{
        res.send("something went wrong!");
    }
});

app.get("/bunksapp/login",(req,res)=>{
    res.render("login.ejs");
});

app.post("/bunksapp/login",async(req,res)=>{
    try{
        let {email,pass}=req.body;
        let validUser=await User.find({
            email:email.trim().toLowerCase(),
            pass:pass.trim()
            });
        if(validUser.length!=0){
            const token=jwt.sign({_id: validUser[0]._id},secretKeyJWT);
            await User.updateOne({_id: (validUser[0]._id)},{logedStat:true});
            if(validUser[0]._id!="667298d69d8ec76a6c9356b1"){
                await User.updateOne({_id: (validUser[0]._id)},{authStat:false});
            }
            res
            .cookie("token",token,{httpOnly:true,secure:true,sameSite:"none"})
            .redirect(`/bunksapp/${validUser[0]._id}/home`);
        }else{
            res.send("Invalid User");
        }
    }catch(err){
        console.log(err);
    } 
});

app.get("/bunksapp/:id/home",async(req,res)=>{
    let {id}=req.params;
    let logUser=await User.findById(id);
    res.render("home.ejs",{logUser});
})

app.get("/bunksapp/:id/:roomName", async(req, res) => {
    try{
        let {id,roomName}=req.params;
        let logCheck=await User.findById(id);
        let chats;
        // if(logCheck.logedStat){
        if(logCheck.authStat){
            chats = await Chat.find({room:roomName});
        };
        let vote=await Vote.find();
        res.render("bunksapp.ejs",{chats,logCheck,roomName,vote});
        // }else{
            // res.send("Logged Out! Log in Again.")
        // }
    }catch(err){
        console.log(err);
    }
    
});

io.use((socket, next) => {
    try{
        cookieParser()(socket.request,socket.request.res,async(err)=>{
            if(err) return next(err);
    
            const token=socket.request.cookies.token;
    
            if(!token) return next(new Error("Authentication Error"));
    
            const decoded =jwt.verify(token,secretKeyJWT);
    
            if(!decoded){
                return next(new Error("Authentication Error"));
            }else{
                next();
            }
            
        })
    }catch(err){
        console.log(err);
    }
    
  });

io.on("connection",(socket) => {
    try{
        let decoded;        
        cookieParser()(socket.request,socket.request.res,async(err)=>{
            const token=socket.request.cookies.token;
    
            decoded =jwt.verify(token,secretKeyJWT);
           
        })

        console.log("user connected!");
        console.log(socket.id);

        socket.emit("welcome",socket.id);

        let joinedRoom=[];

        // socket.broadcast.emit(`${socket.id} joined the server`)

        socket.on("chatreq",(id,name)=>{
            socket.broadcast.to(joinedRoom[0]).emit("chatReqRec",id,name);
        })

        socket.on("votePost",async(data)=>{
            await Vote.updateOne({_id:"6677ed93ca694849c9c1f4a7"},{votePorp:data.purpose, options:data.options,votingStat:true});
        })

        socket.on("joinReq",(roomName)=>{
            socket.join(roomName);
            joinedRoom.push(roomName);
            console.log(joinedRoom)
        })

        socket.on("delMsg",async(msg,timeStore)=>{
            let chat=await Chat.deleteOne({message:msg.trim(),created_at:timeStore});
            console.log(chat);
            socket.broadcast.to(joinedRoom[0]).emit("delRecMsg",msg,timeStore);
        })

        socket.on("disconnect",async()=>{
            console.log("user disconnected!");
            await User.updateOne({_id: decoded._id},{logedStat:false});
            joinedRoom=[];
        })

        socket.on("msgSend", async(msg,name,id,date) => {
            socket.to(joinedRoom[0]).emit("msgRec", msg,name,date);
            let user=await User.findById(id);

            let chat0 = new Chat({
                from: user.name,
                message: msg,
                room: joinedRoom[0],
                created_at: date,
                anonymous: false
            });
            chat0.save().catch((err) => {
                console.log(err);
            });
        });

        socket.on("msgAnonySend", async(msg,name,id,date) => {
            socket.to(joinedRoom[0]).emit("msgRec", msg,name,date);
            let user=await User.findById(id);

            let chat0 = new Chat({
                from: user.name,
                message: msg,
                room: joinedRoom[0],
                created_at: date,
                anonymous: true
            });
            chat0.save().catch((err) => {
                console.log(err);
            });
            console.log("2");
        });

        socket.on("allowed",async(id)=>{
            await User.updateOne({_id: id},{authStat:true});
        });

        socket.on("editMsgReq",async(msg,time,oldMsg)=>{
            await Chat.updateOne({created_at:time,message:oldMsg},{message:msg});
            socket.broadcast.emit("editRecMsgReq",msg,time,oldMsg);
        })

        socket.on("resetVote",async()=>{
            let log=await Vote.updateOne({_id:"6677ed93ca694849c9c1f4a7"},{votedYes:[],votedNo:[]});
            console.log(log);
        })

        socket.on("voteUpdate",async(votedFor,id)=>{
            let voteDet=await Vote.find();
            if(!voteDet[0].votedYes.includes(id) && !voteDet[0].votedNo.includes(id)){
                if(votedFor=="Ha"){
                    let update={
                        $push:{
                            votedYes: `${id}`
                        }
                    }
                    let log=await Vote.updateOne({_id:"6677ed93ca694849c9c1f4a7"},update);
                    console.log(log);
                    io.emit("votedYesLiveUpdate");
                }else{
                    let update={
                        $push:{
                            votedNo: `${id}`
                        }
                    }
                    let log=await Vote.updateOne({_id:"6677ed93ca694849c9c1f4a7"},update);
                    console.log(log);
                    io.emit("votedNoLiveUpdate");

                }
            }else{
                console.log('already voted');
            }
            
        })
        
    }catch(err){
        console.log(err);
    }
    
});

server.listen(port, () => {
    console.log("server running on port", port);
});

