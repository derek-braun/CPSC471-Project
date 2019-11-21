var express = require('express');
var mysql = require('mysql');
var app = express();

app.set("view engine", "ejs");

var connection = mysql.createConnection({
    host    : 'localhost',
    user    : 'username',
    password: 'password',
    database: 'cpsc471project'
});

app.get("/", function (req, res){
    //redirect to login
    res.redirect("/login");
});

app.get("/login", function (req, res){
    // var q = "SELECT * FROM users";
    // connection.query(q, function(err, results){
    //     if(err) throw err;
    //     console.log(results);
    // })
    res.render("login");
});

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

app.listen(8080, function(){
    console.log("Server Running on Port 8080");
});