const mongoose = require('mongoose');
const express = require("express");
const app = express();
const path = require("path");
const Chat = require("./models/chat.js");
const User = require("./models/user.js");
const methodOverride = require("method-override");
var jwt = require("jsonwebtoken");
const secretKeyJWT="kuldeepwebd";


const { Server } = require("socket.io");
const { createServer } = require("node:http");
const cookieParser = require('cookie-parser');
const server = createServer(app);
const io = new Server(server);

app.use(methodOverride("_method"))

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const port = 9000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "public")));

main()
    .then(() => {
        console.log("connection succeded!")
    })
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect("mongodb+srv://kuldeeppandat:kpvaultserver8055@cluster1.rbtvmid.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1");
}

app.get("/", (req, res) => {
    res.send("root is working");
});

app.get("/bunksapp/signup",(req,res)=>{
    res.render("signup.ejs")
})

app.post("/bunksapp/signup",(req,res)=>{
    try{
        let { name,roll,email,password } = req.body;
        let newUser = new User({
            name: name.toLowerCase(),
            rollno: roll.toLowerCase(),
            email: email.toLowerCase(),
            pass: password
        })
        newUser.save()
            .catch((err) => {
                console.log(err);
            })

        res.redirect("/bunksapp/login");
    }catch{
        res.send("something went wrong!");
    }
})

app.get("/bunksapp/login",(req,res)=>{
    res.render("login.ejs");
})

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
            res
            .cookie("token",token,{httpOnly:true,secure:true,sameSite:"none"})
            .redirect(`/bunksapp/${validUser[0]._id}`);
        }else{
            res.send("Invalid User");
        }
    }catch(err){
        console.log(err);
    } 
});

app.get("/bunksapp/home",(req,res)=>{
    res.render("home.ejs");
})

app.get("/bunksapp/:id", async(req, res) => {
    try{
        let {id}=req.params;
        let logCheck=await User.findById(id);
        if(logCheck.logedStat){
            let chats = await Chat.find();
            res.render("bunksapp.ejs",{chats,logCheck});
        }else{
            res.send("Logged Out! Log in Again");
        }
    }catch(err){
        console.log(err);
    }
    
});

app.post("/bunksapp/chat/:id",async(req,res)=>{
    try{
        let { sentMsg } = req.body;
        let {id}=req.params;
        let user=await User.findById(id);
        let chat0 = new Chat({
            from: user.name,
            message: sentMsg,
            created_at: new Date()
        });
        chat0.save().catch((err) => {
            console.log(err);
        });
            
    }catch{
        res.send("something went wrong buh");
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

        // socket.broadcast.emit(`${socket.id} joined the server`)

        socket.on("disconnect",async()=>{
            console.log("user disconnected!");
            await User.updateOne({_id: decoded._id},{logedStat:false});
        })

        socket.on("msgSend", (msg,name) => {
            socket.broadcast.emit("msgRec", msg,name);
        });
    }catch(err){
        console.log(err);
    }
    
});

server.listen(port, () => {
    console.log("server running on port", port);
});

