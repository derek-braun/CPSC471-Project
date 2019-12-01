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
        var q = "INSERT INTO USER VALUES(?, ?, ?, ?);"
        connection.query(q, [req.body.username, req.body.password, "client", req.body.birthday], function(err, results){
            if(err) console.log("An error has occured");
        });
        q = "INSERT INTO FACULTY_ASSIGNMENT VALUES(?, ?);"
        connection.query(q, [req.body.faculty, req.body.username], function(err, results){
            if(err) console.log("An error has occured");
        });
        setTimeout(function() {
            return res.redirect("profile");
        }, 50);
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
    //TODO fix no interests issue
    var username;
    var password;
    var birthday;
    var topics = new Array();
    var experience = new Array();
    var faculty;
    var q = "SELECT I.InterestName, I.Experience, U.Username, U.Password, U.Birthdate, F.FacultyName " +
        "FROM USER AS U, USER_INTEREST AS I, FACULTY_ASSIGNMENT AS F " +
        "WHERE U.Username = I.Username AND U.Username = F.Username AND U.Username = ?";
    connection.query(q, [req.session.userId], function(err, results){
        if(err) console.log("An error has occurred");
        if(results.length > 0) {
            username = results[0].Username;
            password = results[0].Password;
            birthday = results[0].Birthdate;
            faculty = results[0].FacultyName;
            for(var i = 0; i < results.length; i++) {
                topics[i] = results[i].InterestName;
                experience[i] = results[i].Experience;
            }
            return res.render("profile", {username: username, password: password, birthday: birthday,
                topics: topics, experience: experience, faculty: faculty});
        }
    });
});

app.get("/activity", function(req, res){
    res.render("activity");
});

app.post("/updateProfile", function(req, res){
    var q = "UPDATE USER SET Password = ?, Birthdate = ? WHERE Username = ?;"
    connection.query(q, [req.body.password, req.body.birthday, req.session.userId], function(err, results){
        if(err) console.log("An error has occured");
    });
    q = "UPDATE faculty_assignment SET FacultyName = ? WHERE Username = ?;"
    connection.query(q, [req.body.faculty, req.session.userId], function(err, results){
        if(err) console.log("An error has occured");
    });
    setTimeout(function() {
        return res.redirect("profile");
    }, 50);
});

app.post("/addInterest", function(req, res){
    var q = "INSERT INTO INTEREST_TOPIC VALUES(?, 1, null)";
    connection.query(q, [req.body.addInterest], function(err, results){
        if(err) console.log("Interest Already Exists");
    });
    q = "INSERT INTO USER_INTEREST VALUES(?, ?, 1)";
    connection.query(q, [req.body.addInterest, req.session.userId], function(err, results){
        if(err) console.log("An error has occured");
    })
    setTimeout(function() {
        return res.redirect("profile");
    }, 50);
});

app.post("/removeInterest/:id", function(req, res){
    var q = "DELETE FROM USER_INTEREST WHERE InterestName = ? AND Username = ?;"
    connection.query(q, [req.params.id, req.session.userId], function(err, results){
       if(err) console.log("An error has occured");
       return res.redirect("/profile");
    });
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