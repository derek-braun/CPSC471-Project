var express = require('express');
var mysql = require('mysql');
var app = express();

var connection = mysql.createConnection({
    host    : 'localhost',
    user    : 'dbraun',
    password: 'password',
    database: 'cpsc471project'
});

app.get("/", function (req, res){
    var q = "SELECT * FROM users";
    connection.query(q, function(err, results){
        if(err) throw err;
        console.log(results);
    })
    res.send("You've reached the login page");
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