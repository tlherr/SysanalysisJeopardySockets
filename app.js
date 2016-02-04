var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var parsedJSON = require('./jeopardy.json');


var counter = 1;
var people = {};
var points = {};
var admin = null;
var activeAvailable = false;
var currentQuestion = null;
var currentAnswerer = null;
var password = guid();

console.log("The Admin Password is: "+password);

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

app.use(cookieParser());
app.use(express.static('public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

//document.cookie="password=thesecretpassword"
app.get('/admin', function(req, res) {
   if(req.cookies.password==password) {
       res.sendFile(__dirname + "/admin.html");
   } else {
       res.sendStatus(401);
   }
});

io.on("connection", function (socket) {

    console.log("A New Client Connected");

    socket.on("joined", function(){
        var name = "Student-"+counter;
        counter++;
        console.log("New Client Joined: "+ name);
        people[socket.id] = name;
        points[name] = 0;
        socket.emit("received_name", name);
        socket.emit("update", "You have connected to the server.");
        io.sockets.emit("update-people", people);
    });

    socket.on("admin_joined", function() {
        admin = socket.id;
        people[socket.id] = "Admin";
    });

    socket.on("get_question_data", function() {
        if(socket.id==admin) {
            socket.emit("question_data_received", parsedJSON);
        }
    });

    socket.on("set_questions_open", function() {
        if(socket.id==admin) {
            activeAvailable = true;
        }
    });

    socket.on("reset_answerer", function() {
       if(socket.id==admin) {
           currentAnswerer = null;
       }
    });

    socket.on("question_answered", function(results, answerer, question, col, row) {
        if(socket.id==admin) {
            io.sockets.emit("client_question_answered", answerer, results[1].value, question, col, row);
            if(results[1].value) {
                points[answerer] += question.jeopardyValue;
            } else {
                points[answerer] -= question.jeopardyValue;
            }

            io.sockets.emit("modify_points", points);
            activeAvailable = true;
        }
    });

    socket.on("buzzing" , function(col, question) {
       console.log("Buzzing from: "+people[socket.id]);

        if(activeAvailable && currentAnswerer==null) {
            //A question is available to be answered and no one is answering it, allow this person to answer
            currentAnswerer = people[socket.id];
            socket.emit("buzz_success");
            io.sockets.emit("answerer_selected", people[socket.id], col, question);
        } else {
            socket.emit("buzz_failure");
        }
    });

    socket.on("name_change", function(newName) {
        var oldName = people[socket.id];
        people[socket.id] = newName;

        var index = points.indexOf(oldName);
        if (index > -1) {
            points.splice(index, 1);
        }

        console.log(oldName+" has been renamed to "+newName);
        io.sockets.emit("update", oldName+" has been renamed to "+newName);
        io.sockets.emit("update-people", people);
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