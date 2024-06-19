const mongoose = require('mongoose');
const express = require("express");
const app = express();
const path = require("path");
const Chat = require("./models/chat.js");
const User = require("./models/user.js");
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
    await mongoose.connect("mongodb://localhost:27017/whatsapp");
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
                name: name.toLowerCase(),
                student: userStat,
                email: email.toLowerCase(),
                pass: password
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
            email:email,
            pass:pass
            });
        if(validUser.length!=0){
            const token=jwt.sign({_id: validUser[0]._id},secretKeyJWT);
            await User.updateOne({_id: (validUser[0]._id)},{logedStat:true});
            if(validUser[0]._id!="667292f23590ad2f5544087d"){
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
        res.render("bunksapp.ejs",{chats,logCheck,roomName});
        // }else{
            // res.send("Logged Out! Log in Again.")
        // }
    }catch(err){
        console.log(err);
    }
    
});

app.post("/bunksapp/chat/:id/:roomName",async(req,res)=>{
    try{
        let { sentMsg } = req.body;
        let {id,roomName}=req.params;
        let user=await User.findById(id);

        let chat0 = new Chat({
            from: user.name,
            message: sentMsg,
            room: roomName,
            created_at: new Date()
        });
        chat0.save().catch((err) => {
            console.log(err);
        });
            
    }catch{
        res.send("something went wrong");
    }
    res.status(204).send();
    
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

        let joinedRoom=[];

        // socket.broadcast.emit(`${socket.id} joined the server`)

        socket.on("chatreq",(id,name)=>{
            socket.broadcast.emit("chatReqRec",id,name);
        })

        socket.on("joinReq",(roomName)=>{
            socket.join(roomName);
            joinedRoom.push(roomName);
            console.log(joinedRoom)
        })

        socket.on("disconnect",async()=>{
            console.log("user disconnected!");
            await User.updateOne({_id: decoded._id},{logedStat:false});
            joinedRoom=[];
        })

        socket.on("msgSend", (msg,name) => {
            socket.to(joinedRoom[0]).emit("msgRec", msg,name);
        });

        socket.on("allowed",async(id)=>{
            await User.updateOne({_id: id},{authStat:true});
        })

        
    }catch(err){
        console.log(err);
    }
    
});

server.listen(port, () => {
    console.log("server running on port", port);
});

