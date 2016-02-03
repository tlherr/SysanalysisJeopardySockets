var express = require('express');
var cookieParser = require('cookie-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var people = {};
var activeAvailable = false;
var currentQuestion = null;
var currentAnswerer = null;

app.use(cookieParser())
app.use(express.static('public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

//document.cookie="password=thesecretpassword"
app.get('/admin', function(req, res) {
   if(req.cookies.password=="thesecretpassword") {
       res.sendFile(__dirname + "/admin.html");
   }
});

io.on("connection", function (socket) {

    console.log("A New Client Connected");

    socket.on("join", function(name){
        console.log("New Client Joined: "+ name);
        people[socket.id] = name;
        socket.emit("update", "You have connected to the server.");
        io.sockets.emit("update-people", people);
    });

    socket.on("buzzing" , function(name) {
       console.log("Buzzing from: "+name);

        if(activeAvailable && currentAnswerer==null && currentQuestion) {
            //A question is available to be answered and no one is answering it, allow this person to answer
            currentAnswerer = people[socket.id];
            socket.emit("buzz_success", currentQuestion);
            io.sockets.emit("answerer_selected", name, currentQuestion);
        } else {
            socket.emit("buzz_failure");
        }
    });


    socket.on("disconnect", function(){
        console.log("Client Disconnected: "+people[socket.id]);
        io.sockets.emit("update", people[socket.id] + " has left the server.");
        delete people[socket.id];
        io.sockets.emit("update-people", people);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});