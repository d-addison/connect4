/*
        --== Signing in etc ==--
 */

function logout() {
    console.log("Logging out...");
    $.get("/api/user/logout", function() {
        console.log("Logging out...");
    });
}

/*
        --== CSS Functions ==--
*/
function show(x){
    let gMenu = document.getElementById(x);
    if (gMenu.style.display !== "none") {
        gMenu.style.display = "none";
    } else {
        gMenu.style.display = "block";
    }
}

function hide(x) {
    document.getElementById(x).display = 'none';
    console.log("hiding " + x);
}

function switchStatus(x) {
    $.post("/api/user/changeStatus", {status: x});
}

$(document).ready(function() {
    let friendsList = document.querySelectorAll(".friend");
    for(let i = 0; i < friendsList.length; i++) {
        if ($(friendsList[i]).parent('ul#friendsList').length) {
            $(friendsList[i].getElementsByClassName("remove")).click(function (e) {
                e.preventDefault();
                removeFriend(friendsList[i].getAttribute("id"));
            });
        } else if ($(friendsList[i]).parent('ul#incomingFriends').length) {
            $(friendsList[i].getElementsByClassName("accept")).click(function (e) {
                e.preventDefault();
                acceptRequest(friendsList[i].getAttribute("id"));
            });

            $(friendsList[i].getElementsByClassName("deny")).click(function (e) {
                e.preventDefault();
                denyRequest(friendsList[i].getAttribute("id"));
            });
        }
    }

    let friend = document.querySelectorAll(".notFriends");
    $(friend[0]).click(function (e) {
        e.preventDefault();
        addFriend(friend[0].getAttribute("id"));
    })

    let addUser = document.querySelectorAll(".add");
    for(let i = 0; i < addUser.length; i++) {
        $(addUser[i]).click(function (e) {
            e.preventDefault();
            addFriend(addUser[i].getAttribute("id"));
        })
    }

    let challengeUsers = document.querySelectorAll(".challenge");
    for(let i = 0; i < challengeUsers.length; i++) {
        $(challengeUsers[i]).click(function (e) {
            e.preventDefault();
            challengeFriend(challengeUsers[i].getAttribute("id"));
        })
    }
});

function removeFriend(x) {
    if(confirm("Remove " + x + " from friends list?")) {
        $.post("/api/user/removeFriend", {user: x});
        console.log(x + " removed from friends list.");
    }
}

function acceptRequest(x) {
    if(confirm("Accept " + x + "'s friend request?")) {
        $.post("/api/user/acceptFriendRequest", {name: x});
        console.log(x + " added to your friendslist!");
    }
}

function denyRequest(x) {
    if(confirm("Deny " + x + "'s friend request?")) {
        $.post("/api/user/denyFriendRequest", {name: x});
        console.log(x + "'s friend request denied...");
    }
}

function addFriend(x) {
    if(confirm("Add " + x + "?")) {
        $.post("/api/user/addFriend", {name: x});
        console.log(x + "'s friend request sent...");
    }
}

function challengeFriend(x) {
    if(confirm("Challenge " + x + " to a game of ConnecFTW?")) {
        $.post("/api/user/challengeFriend", {name: x});
        console.log(x + "'s challenge request sent...");
    }
}

/*
        --== Sidebar/Clickable Sidebar ==--
 */
const navSlide = () => {
    const burger = document.querySelector(".burger");
    const nav = document.querySelector(".navLinks");
    const navLinks = document.querySelectorAll(".navLinks li");
    // toggle
    burger.addEventListener('click', () => {
        nav.classList.toggle('nav-active');

        // animate
        navLinks.forEach((link, index) => {
            if(link.style.animation) {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.1}s`;
            }
        });

        burger.classList.toggle('toggle');
    });
}

navSlide();














