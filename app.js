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

app.get("/feedbackClient", function(req, res){
    res.render("feedbackClient");
});

/*app.get("/feedbackAdmin", function(req, res){
    res.render("feedbackAdmin")
})*/

app.get("/notifications", function(req, res){
    res.render("notifications");
})

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
        q = "INSERT INTO USER_INTEREST VALUES(?, ?, ?);"
        connection.query(q, ["University", req.body.username, 1], function(err, results){
            if(err) console.log("An error has occured");
        });
        q = "INSERT INTO CLIENT_USER VALUES(?, 1, null);"
        connection.query(q, [req.body.username], function(err, results){
            if(err) console.log("An error has occured inserting into client user table");
        });
        setTimeout(function() {
            return res.redirect("/profile");
        }, 100);
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

app.get("/joinActivity/:id", function(req, res) {
    var q = "SELECT * FROM ACTIVITY WHERE ActivityId = ?";
    var activity;
    var participant;
    var user = req.session.userId;
    connection.query(q, [req.params.id], function(err, results){
        if(err) throw err;
        else activity = results[0];
    });
    q = "SELECT * FROM ACTIVITY_PARTICIPATION WHERE ActivityId = ? AND Member = ?";
    connection.query(q, [req.params.id, req.session.userId], function(err, results){
        if(err) throw err;
        if(results.length == 0) participant = false;
        else participant = true;
    });
    setTimeout(function() {
        res.render("joinActivity", {activity: activity, participant: participant, user: user});
    }, 50);
});

app.post("/joinActivity/:id", function(req, res){
    var q = "INSERT INTO ACTIVITY_PARTICIPATION VALUES(?, ?);"
    connection.query(q, [req.params.id, req.session.userId], function(err, results) {
        if(err) throw err;
        res.redirect("/search");
    });
});

app.post("/leaveActivity/:id", function(req, res) {
    var q = "DELETE FROM ACTIVITY_PARTICIPATION WHERE ActivityId = ? AND Member = ?;";
    connection.query(q, [req.params.id, req.session.userId], function(err, results) {
        if(err) throw err;
        res.redirect("/search");
    });
});

app.get("/removeActivity/:id", function(req, res) {
    var q = "UPDATE ACTIVITY SET IsActive = false WHERE ActivityId = ?";
    connection.query(q, [req.params.id], function(err, results) {
        if(err) throw err;
        res.redirect("/search");
    });
});

app.get("/search", function(req, res){
    var today = new Date();
    var format = String(today.getFullYear()) + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
    //format = "2019-11-01"
    var user = req.session.userId;
    var q = "SELECT A.ActivityId, A.Title, A.StartTime, A.Username, A.Description, A.Duration, A.IsActive, A.TopicGroup, A.Interest, COUNT(*) As Count " +
        "FROM ACTIVITY AS A, USER_INTEREST AS I, ACTIVITY_PARTICIPATION AS AP " +
        "WHERE A.Interest = I.InterestName AND I.Username = ? AND AP.ActivityId = A.ActivityId AND A.IsActive = true " +
        "AND A.StartTime > ? " +
        "GROUP BY ActivityId " +
        "UNION " +
        "SELECT A.ActivityId, A.Title, A.StartTime, A.Username, A.Description, A.Duration, A.IsActive, A.TopicGroup, A.Interest, COUNT(*) AS Count " +
        "FROM ACTIVITY AS A, ACTIVITY_PARTICIPATION AS AP " +
        "WHERE A.Interest = 'None' AND AP.ActivityId = A.ActivityId AND A.IsActive = true " +
        "AND A.StartTime > ? " +
        "GROUP BY ActivityId";
    connection.query(q, [req.session.userId, format, format], function(err, results){
       if(err) throw err;
       res.render("search", {activityData: results, user: user});
    });
});

app.post("/searchActivities", function(req, res) {
    var today = new Date();
    var format = String(today.getFullYear()) + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
    //format = "2019-11-01"
    var user = req.session.userId;
    var q = "SELECT A.ActivityId, A.Title, A.StartTime, A.Username, A.Description, A.Duration, A.IsActive, A.TopicGroup, A.Interest, COUNT(*) As Count " +
        "FROM ACTIVITY AS A, USER_INTEREST AS I, ACTIVITY_PARTICIPATION AS AP " +
        "WHERE A.Interest = I.InterestName AND I.Username = ? AND AP.ActivityId = A.ActivityId AND A.IsActive = true " +
        "AND A.StartTime > ? AND A.Title LIKE ? " +
        "GROUP BY ActivityId " +
        "UNION " +
        "SELECT A.ActivityId, A.Title, A.StartTime, A.Username, A.Description, A.Duration, A.IsActive, A.TopicGroup, A.Interest, COUNT(*) AS Count " +
        "FROM ACTIVITY AS A, ACTIVITY_PARTICIPATION AS AP " +
        "WHERE A.Interest = 'None' AND AP.ActivityId = A.ActivityId AND A.IsActive = true " +
        "AND A.StartTime > ? AND A.Title LIKE ? " +
        "GROUP BY ActivityId";
    var like = ("%" + req.body.searchBar + "%");
    connection.query(q, [req.session.userId, format, like, format, like], function(err, results){
        if(err) throw err;
        res.render("search", {activityData: results, user: user});
    });
});

app.get("/profile", function(req, res){
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

app.post("/createActivity", function(req, res) {
    var insertId;
    if(req.body.interest == ""){
        req.body.interest = "None";
    }
    var q = "INSERT INTO activity VALUES(null, ?, ?, ?, ?, ?, true, ?, ?, null)";
    connection.query(q, [req.body.title, req.body.startDate + " " + req.body.startTime, req.session.userId, req.body.description, req.body.duration, req.body.group, req.body.interest], function(err, results){
       if(err) throw err;
       insertId = results.insertId;
    });
    setTimeout(function() {
        var q = "INSERT INTO ACTIVITY_PARTICIPATION VALUES(?, ?);"
        connection.query(q, [insertId, req.session.userId], function(err, results) {
            if(err) throw err;
            return res.redirect("/search");
        });
    }, 50);
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
        //if(err) console.log("Interest Already Exists");
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

app.post("/createFeedback", function(req, res){
    var q = "INSERT INTO FEEDBACK VALUES(null, ?, ?, ?);"
    connection.query(q, [req.session.userId, req.body.feedback, req.body.topic], function(err, results){
        if(err) console.log("An error has occured in creating feedback");
    })

    q = "INSERT INTO FEEDBACK_VIEW VALUES(null, ?);"
    
    if(req.body.topic == "bugs-fixes"){
        console.log("Made it to bugs-fixes");
        connection.query(q, ["admin1"], function(err, results){
            if(err) console.log("An error has occured inserting into feedback_view bugs-fixes");
            return res.redirect("/search");
        });
    }

    else if(req.body.topic == "upgrading"){
        console.log("Made it to upgrading");
        connection.query(q, ["admin2"], function(err, results){
            if(err) console.log("An error has occured inserting into feedback_view upgrading");
            return res.redirect("/search");
        })
    }

    else if(req.body.topic == "general"){
        console.log("Made it to general");
        connection.query(q, ["admin3"], function(err, results){
            if(err) console.log("An error has occured inserting into feedback_view general");
            return res.redirect("/search");
        })
    }
})

app.get("/feedbackAdmin", function(req, res){
    var q = "SELECT V.FeedbackId, F.FeedbackId, F.Content, F.ClientName " +
             "FROM FEEDBACK_VIEW AS V, FEEDBACK AS F " +
             "WHERE V.FeedbackId = F.FeedbackId";
    connection.query(q, function(err, results){
        if(err) throw err;
        res.render("feedbackAdmin", {feedbackData: results});
    })
})

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