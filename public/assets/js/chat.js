// Global variables
var currentUser;
var Messages = Parse.Object.extend("Messages");
var now;

function attemptLogin() {
    now = new Date();
    $("#introDiv").slideToggle("slow", function() {
        $("#userform").toggle();

        // Changing intro text to display username
        $("#username").text("Greetings, " + currentUser.get("username") + ".");

        $("#messagediv").slideToggle("slow");
        $("#chatbox").text("");
    });
}

function attemptLogout() {
    Parse.User.logOut();
    currentUser = Parse.User.current();
    $("#messagediv").slideToggle("slow", function() {
        $("#userform").toggle();
        $("#introDiv").slideToggle("slow");
    })
}

function showRegisterForm() {
    $("#introDiv").slideToggle("slow", function() {
        $("#userform").toggle();
        $("#registerDiv").slideToggle("slow");
    });
}

function hideRegisterForm() {
    $("#registerDiv").slideToggle("slow", function() {
        $("#userform").toggle();
        $("#introDiv").slideToggle("slow");
    })  
}


/* WebSocket */
function appendResults(results) {
    var oldscrollHeight = $("#chatbox").prop("scrollHeight");

    for (var i = 0; i < results.length; i++) {
        var object = results[i];
        var timeString = "(" + object.createdAt.getHours() + ":" + object.createdAt.getMinutes() + ")";
        $("#chatbox").append("<div class=\"chatText\">" + timeString + " <b>" + object.get("sendUser") + ": </b>" + object.get("message") + "</div>");
    }

    if (results.length != 0)
        now = results[results.length - 1].createdAt;

    var newScrollHeight = $("#chatbox").prop("scrollHeight");
    if (newScrollHeight > oldscrollHeight) {
        $("#chatbox").animate({scrollTop: newScrollHeight}, 'normal');
    }

}

// /* PULLING */
// window.setInterval( function(){
//     if(currentUser !== null) {
//         var query = new Parse.Query(Messages);
//         query.greaterThan("createdAt", now);
//         query.find({
//             success: function(results) {
//                 appendResults(results);
//             },

//             error: function(error) {
//                 alert("Error: " + error.code + " " + error.message + ".");
//             }
//         })
//     }
// }, 1000);



$(document).ready(function() {
    Parse.initialize("pocowebparse", "XoHirs3LE7PhOYiR");
    Parse.serverURL = 'http://localhost:1337/parse';

    currentUser = Parse.User.current();
    if (currentUser != null) { // There is a user logged in
        now = new Date();
        $("#userform").hide();
        $("#introDiv").hide();
        $("#username").text("Greetings, " + currentUser.get("username") + ".");
        $("#messagediv").slideToggle("slow");
        $("#chatbox").text("");
    }


    $("#showRegisterForm").click(showRegisterForm);
    $("#cancel").click(hideRegisterForm);

    $("#registerButton").click(function() {
        var regName = $("#regUsername").val().toString();
        var regPass = $("#regPassword").val().toString();
        if (regName === "" || regPass === "") {
            alert("Please fill in all credentials!");
        } else {
            var user = new Parse.User();
            user.set("username", regName);
            user.set("password", regPass);

            user.signUp(null, {
                success: function(user) {
                    alert("Thanks for signing up!");
                    hideRegisterForm();
                },

                error: function(user, error) {
                    alert("Error: " + error.code + " " + error.message + ".");
                }
            });
        }
    });

    $("#loginButton").click(function() {
        var username = $("#usernameField").val().toString();
        var password = $("#passwordField").val().toString();

        Parse.User.logIn(username, password, {
            success: function(user) {
                
                currentUser = user;
                attemptLogin();
            },

            error: function(user, error) {
                alert("Error: " + error.code + " " + error.message + "."); 
            }
        });
    });

    $("#logoutButton").click(attemptLogout);

    $("#sendmsg").click(function() {
        var message = $("#usermsg").val().toString();
        var messageObject = new Messages();
        messageObject.save({message: message, sendUser:currentUser.get("username")}).then(function(object) {
            $("#usermsg").val("");
        });
    });


    var query = new Parse.Query('Messages');
    
    /* Uncomment the following line to talk to oneself? */
    //query.equalTo('sendUser', currentUser.get("username"));

    $.subscription = query.subscribe();

    $.subscription.on('open', function(){
        console.log('subscription opened');
    }); 

    $.subscription.on('create', function(message){
        appendResults([message]);

        console.log(message.get('message')); // This should output Mengyan
    });

    // subscription.on('update', (people) => {
    //   console.log(people.get('score')); // This should output 100
    // });


    // subscription.unsubscribe();


});