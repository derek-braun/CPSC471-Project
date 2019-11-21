var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

//Establish database connection on server side
var connection = mysql.createConnection({
    host    : 'localhost',
    user    : 'username',
    password: 'password',
    database: 'cpsc471project'
});

//Redirect main page to login
app.get("/", function (req, res){
    //redirect to login
    res.redirect("/login");
});

app.get("/signup", function (req, res){
    res.render("signup");
})

app.get("/login", function (req, res){
    // var q = "SELECT * FROM users";
    // connection.query(q, function(err, results){
    //     if(err) throw err;
    //     console.log(results);
    // })
    var bar = "Hello World";
    res.render("login", {foo: bar});
});

// Prevent internal page access without login
// app.use(function(req, res, next) {
//     if(!req.session.accessToken) {
//         res.redirect("/");
//     } else {
//         next();
//     }
// });

app.get("/other", function (req, res){
    res.send("You've reached a different page");
});

//Create server, wait for requests
app.listen(8080, function(){
    console.log("Server Running on Port 8080");
});