var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var app = express();
var session = require('express-session');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

//Database connection credentials
var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'password',
    database : 'termproject471'
});

//Establish database connection on server side
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
});

//use sessions for tracking logins
app.use(session({
    secret: 'work hard',
    resave: true,
    saveUninitialized: false
}));

//Redirect main page to login
app.get("/", function (req, res){
    //redirect to login
    res.redirect("/login");
});

app.get("/signup", function (req, res){
    res.render("signup");
})

app.get("/login", function (req, res){
    res.render("login");
});

app.post("/signup", function(req, res){
    var i = "INSERT INTO Users VALUES(?, ?);"
    connection.query(i, [req.body.username, req.body.password], function(err, results){
        if(err) res.redirect("/signup");
        else res.redirect("/login");
    })
})

app.post("/login", function (req, res){
    var q = "SELECT * FROM Users WHERE Uname = ? AND Pass = ?;"
    connection.query(q, [req.body.username, req.body.password], function(err, results){
        if(err) console.log("An error has occurred");
        if(results.length == 0){
            return res.redirect("/login");
        }
        else if(results.length == 1) {
            req.session.userId = results[0].Uname;
            return res.redirect("/search");
        }
        console.log(results);
    })
})

// Prevent internal page access without login
app.use(function(req, res, next) {
    if(req.session && req.session.userId) {
        next();
    } else {
        res.redirect("/");
    }
});

app.get("/search", function(req, res){
    res.render("search");
})

app.get("/profile", function(req, res){
    res.render("profile");
})

app.get("/other", function (req, res){
    res.send("You've reached a different page");
});

//Create server, wait for requests
app.listen(8080, function(){
    console.log("Server Running on Port 8080");
});