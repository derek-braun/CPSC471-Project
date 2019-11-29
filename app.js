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
    secret: 'The big secret',
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
});

app.get("/login", function (req, res){
    res.render("login");
});

app.post("/signup", function(req, res){
    if(req.body.username != "" && req.body.password != ""){
        var i = "INSERT INTO Users VALUES(?, ?);"
        connection.query(i, [req.body.username, req.body.password], function(err, results){
            if(err) return res.redirect("/signup");
            else return res.redirect("/login");
        })
    }
    else{
        return res.redirect("/signup");
    }
});

app.post("/login", function (req, res){
    var q = "SELECT * FROM USER WHERE Username = ? AND Password = ?;"
    connection.query(q, [req.body.username, req.body.password], function(err, results){
        if(err) console.log("An error has occurred");
        if(results.length == 0){
            return res.redirect("/login");
        }
        else if(results.length == 1) {
            req.session.userId = results[0].Username;
            return res.redirect("/search");
        }
        console.log(results);
    })
});

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
});

app.get("/profile", function(req, res){
    var username;
    var password;
    var birthday;
    var topics = new Array();
    var experience = new Array();
    var q = "SELECT * FROM USER WHERE Username = ?";
    connection.query(q, [req.session.userId], function(err, results){
        if(err) console.log("An error has occurred");
        if(results.length == 1) {
            username = results[0].Username;
            password = results[0].Password;
            birthday = results[0].Birthdate;
        }
    });
    q = "SELECT * FROM USER_INTEREST WHERE Username = ?";
    connection.query(q, [req.session.userId], function(err, results){
        if(err) console.log("An error has occured");
        for(var i = 0; i < results.length; i++) {
            topics[i] = results[i].InterestName;
            experience[i] = results[i].Experience;
        }
    });

    setTimeout(function() {
        return res.render("profile", {username: username, password: password, birthday: birthday, topics: topics, experience: experience});
    }, 50);
});

app.get("/activity", function(req, res){
    res.render("activity");
});

app.get("/logout", function(req, res){
    if (req.session) {
        req.session.destroy(function(err) {
            if(err) {
                return next(err);
            } else {
                return res.redirect('/');
            }
        });
    }
});

//Create server, wait for requests
app.listen(8080, function(){
    console.log("Server Running on Port 8080");
});