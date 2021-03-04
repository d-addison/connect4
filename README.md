ConnecFTW - A Connect 4 Website
# This is my final submission for my COMP2406

# **Table of Contents**
## Functionality
  - Implemented
  - Not Implemented
## **Extensions**
  - Database
  - Password Reset
  - Adaptive-ish Interface
  - Beautified
  - Error Messages
  - Handlebars
  - Password Encryption
  - Replaying Games Slider
  - Chat Rooms
  - Handling Long Game Queues
## **Good Design Choices**
  - UI
  - Chat
  - Game Schema
  - Robustness
## **Possible Improvements**
  - Rewrite & Reformat
  - Colour Correction
  - Better Errors
  - More Beautification
  - Proper Refreshes
  - Restricting User Ability
  - Improved Platform Support
  - Consistent HTTP Methods & Status Codes
## **Modules, Frameworks, and Other Tools**
  - Nodemailer
  - Mongoose
  - Moment
  - Express
  - Bcrypt
  - @Hapi/Joi
  - Handlebars
  - Nodemon
  - Open
  - Node.js
## **Best Features**
  - Everything Works
  - Password Reset
  - Game Replay
  - Profile Picture Selection
  - Burger
## **Page Summary**

# Functionality:
## **Implemented:**
- Create an account
- Manage account information
- Reset password
- Search for users
- Add users, remove friends, message friends, challenge friends, view profiles
- See online status (and change their own)
- Public / private profiles
- View active games (and past ten games of yourself and others, depending on private / public profile, and if you’re friends, and game type)
- Create a new queue by joining a queue for a certain game type
- Challenge a friend to a friendly game
- Game replay
- Chat
- Forfeit a game
- JSON REST API:
- GET -> ‘/users’ gets all users (including yourself, friends, private profile)
- GET -> ‘/users/?user=’ gets a specific user (and if no query, gets all)
- GET -> ‘/games’ gets all games, supports optional queries
- GET -> ‘/games/?player=DerpVader&active=false&detail=full’
## **Not implemented:**
- Be able to invite other users to a chat room
- Visit a user’s profile while in game against them (Click profile picture or a message)
- Rematch option for a casual game

# **Extensions:**
## Database (MongoDB & Mongoose):
I implemented MongoDB for the third project check-in mainly because I found that
Mongoose is extremely helpful. My website makes use of three mongoose Schemas that I
created, a UserModel, GameModel, and ChatModel. The UserModel represents a user and
with Mongoose I am able to easily create new users, search through them, modify them, and
pretty much anything else I can think of. The GameModel allows me to store each game that
is created, along with the chat logs. This allows me to easily load up a game, replay a game,
load up the game chat, and other basics. And finally, the ChatModel, which was thrown
together rather hastily, but it does what I want it to. Each ChatModel stores a list of the users
in the chat, along with all the chat messages, so you can join a chat with your friend and it
maintains the state of the chat. I am using the cloud-based version (Atlas) of MongoDB.

One thing that I didn’t implement but could, given this model, is the ability to add more users
into a chatroom, so you could create a chatroom with more than just the friend you are
chatting with. The big upside to having a database is that I could release this as a website
and it would actually work like any other website, and it’s a great thing to learn and will be
used in most future projects.

## Resettable Password (Nodemailer):
When I was thinking of what every website with an account has, the first thing that came to
mind was the ability to reset your password. After a bit of ninja-googling I stumbled across
Nodemailer! It was fairly easy to implement, with the main difficulty being setting up an email
that would send all of the stuff from.

When you get to the ‘/resetPassword’, you enter your email, which then gets verified (making
sure that there is an account in the database with said email address attached to it, and a
randomly generated, hashed password gets sent to that email. When you login you will then
be directed to your account settings where a pop up will appear, asking you to enter your
temporary password, and to enter a new one. You send it off and you’re good to go! It’s a
fairly easy system to implement but I feel like it really helps with the credibility of the site.

## Adaptive-ish Interface:
I say “ish” because if you check it out, it looks great on widescreen, all the way down to 780
pixels wide (around). Once we get into the mobile size, you can start to see that the great
look of the website does degrade. Most of the pages look just fine (with the exception of the
actual game part of the site). I didn’t get to spend as much time as I would have liked on this
part of the project, but I thought that it was important that I try and make it functional on a
smaller screen, and it is!

I created my own burger (the little icon in the top right, once the screen is small enough), that
can be clicked to open up the navigation menu, that normally sits at the top of the screen. I
even added a little animation!. It sits on top of all the other elements so that you can still
navigate through the site, and interact with everything on it.

If I had more time to work on this website, this is definitely a skill worth developing, and
would help with the initial planning of the website.

## Beautified:
My website doesn’t look amazing, but I’m pretty darn proud of it. This is my first website, and
my first time doing any HTML, CSS, or JavaScript, and I’ve gotta say I think I did a good job
making the site look appealing to the eye. There are of course some parts of pages that
could do with some work (mainly the profile pages), but I don’t think that any element on my
site detracts from the general quality of it.

I spent a decent amount of time planning up a colour scheme that would not only be
functional, but would also increase the overall quality of the experience on the site. One of
my friends did a workshop on colours and that definitely enlightened me on the importance
of the colours. If you check out my first submission (I believe..?) and compare the colour
scheme to this one, not only does it look less “flash game-y”, it looks more professional and
sleek.

The part that I am happiest with is definitely the friends tab. I really had a pain making the
icon for each person, but I think that it turned out great!

## Error Messages:
Something I would have liked to implement was “Flash”, but I unfortunately ran out of time,
but I needed a way of letting the user know if something went wrong. Since I’ve been trying
to use Handlebars to the maximum extent possible, I introduced a feature (to a select few
pages) that, if a message is fed to the page, it will render that message and it will be obvious
what the error is. Unfortunately, some of the errors are poorly formatted, but if I had more
time to work on it, I could have made the errors more readable.

Error messages are something that I definitely skipped over (everything was console.logs)
until the end. It’s a feature that can get easily overlooked. The login page, register page,
reset password page, and the play page all take advantage of the error messages that would
otherwise be sent out on console.logs in order to alert the user of whatever issue they may
face.

I also took advantage of socket.io to send real-time messages to the user when they try to
place a piece in an invalid spot, or when it’s not their turn, or any other messages that would
be important to be relayed to the user when viewing / spectating / playing a game / chat.

## Handlebars:
I’m not sure if this counts as an extension (in fact I’m fairly certain it doesn’t) but I wanted to
write about it somewhere and I think that this is the best place for it.
There was a lot of talk about using a templating engine such as EJS or PUG, and so I did
some research on them. I found that PUG was maybe a little less liked than something like
EJS, so I looked at that. I was instantly not interested in EJS when I saw that I needed to use
the “%” symbol (I’m a lazy coder okay!), so I decided to look elsewhere, and stumbled
across Handlebars.

This templating engine is amazing, and has allowed me to do anything I could think of. One
of the neat features of it is that I can write my own functions (and I wrote many). These
functions can then be called within my template. This allows me to easily hide information
from the user (by not including it on the page) if for whatever reason they shouldn’t be able
to see it.

One of the big helpers is that I can iterate through multiple objects that I feed it, which allows
me to dynamically load information (like a friends list!). So by feeding my engine a list of
friends, I can do something like “{{#each friends}} <some html> {{/each}}”, which allows me
to load up each friend, and saves a lot of time coding.

I tried to use Handlebars as much as possible (for better or for worse) but I’ve grown to really
like using it (even though I know no alternative).

## Password Encryption (bcrypt):
A very important part of a website is account security, and if someone is able to access your
account, that’s a big problem. A simple yet powerful tool to prevent this is to encrypt a user’s
password so that it can be stored in the database “safely”.

I used bcrypt to encrypt and hash a user’s password when it gets sent to the server. I can
then use bcrypt to validate that the password entered is the correct password to the account.
This was implemented quite early on into the project because it just seemed to be a rather
important part of the website.

I was developing this website with the idea that it would be deployed onto the web, which is
why I tend to add a lot of neat features, and saved the main features until the end (which I
now regret, but I digress).

## Replaying Games Speed Slider:
This is more of a little but interesting feature than anything, but when you replay an old
game, I included a little slider bar that lets you choose the time it takes to place each piece.
By using an asynchronous sleep() function, I can get the value of the slider after every single
sleep()/piece. This allows you to slow it down, and speed it back up while it’s still going.
One thing that I could have easily implemented (but simply ran out of time / had other
priorities) would have been a pause button that would sleep indefinitely until pressed again.

## Chat Rooms:
Another little feature that I added is that your chat messages are dependent on you and the
game you’re in. If you’re viewing a game as a spectator, locally, you will see your “favourite”
colour as your bubble colour, but everyone else in the lobby will see you as a grey bubble.
This allows for easy distinction of who is a spectator or not (along with a “[Spectator]” tag).
Another thing you’ll notice is that if you view a game that you are/were a part of, it will display
your colour and the opponents colour correctly, whereas, if you viewed a game that you
didn’t partake in, you would see the game be set as default colours (red v. black).
It’s just a little feature but it really helps with distinguishing who's who and what's what.

## Long Queue:
Another small feature but it’s worth mentioning as you might not even know it exists. If
you’ve been waiting for a game for a while, once you hit the 5 minute mark, you will get
booted out of the queue and asked to try again or use a different gamemode. This prevents
you from queueing with someone who might be AFK (away from keyboard), and shows that
the server hasn’t forgotten about the user.

## **Good Design Decisions**
Yes, my possible improvements section is going to be 10x larger than this, but it’s a lot
easier to find the issues than it is to focus on the good. ¯\_( ツ )_/¯

## UI:
I’m really happy with how I designed my user interface (with the exception of one thing,
which I will mention at the end). For the most part, each part of the website is rather clean,
and straight to the point. One of the highlights of my UI is on the Friends page. You can see
the user’s name, profile picture, online status, and win/loss ratio, which are the main bits of
information you would want to know. And on the right of that, the icons, which allow the user
to interface with their friends or other users on the site.

The icons are properly coloured and pictured to represent the action that they perform when
clicked. It is obvious from looking at them and there is no questioning what each button
does. This allows for a quick understanding of how to make your way around the website.
Another part of the UI that will please users is the responsiveness of hovering over certain
things. If something is clickable, it will either get highlighted, your cursor will change to a
pointer, or the element will darken. This shows users what is clickable, and what is not. It’s a
feature that you don’t notice when it's there, but you certainly notice it when it is not.

## Chat:
The way that I implemented the chat is pretty straightforward, but it's simplicity does a lot for
the user. To start off, if you join as a spectator, your messages will still be your favourite
colour, but to the two players, it will be grey and have a spectator tag on it. This allows them
to not be distracted while playing / chatting with the opponent. When you load up a game, it
will also load up the chat log, this is the same for the chatroom as well.

## Game Schema:
The way that I designed my game schema allowed me to implement it into my website with
ease. I can find out whether a game is finished, whose turn it is, and what the game board
looks like, and combined with Handlebars, I can then display it to the user in a somewhat
visually impressive-ish way. At the very least, it gets the point across to the user as to
whether a game is finished, or if it’s their turn to play. You can also very easily tell what the
winning combination was when looking at a user's past games.

## Robust:
For the most part, my system handles bad requests with three possible outcomes: a redirect
to a page, an error message, or both. There are some parts of the project that were rushed
and I’m sure I missed a few cases where bad input might lead to some bad results. For the
most part though, the user shouldn’t be able to do anything that would break the system.
With a little rewriting, this code would be ready to go online, and would be able to handle a
decent traffic load, assuming I’ve removed the extra calls to the database that were
unnecessary.

# **Possible Improvements:**
I could write an essay on this part of the report, but I’ll try and keep it relatively short and to
the point.

## Rewrite / Reformatting Code:
I doubt I’m the only one who will be writing something like this because most of us are new
at web development, and for me personally, this is my first “real” coding project so I’m still
learning proper workflow etc. My biggest downfall (and you can tell if you look at my code, or
if you go on my site), is that my code is a bit of a mess of new and old code, intertwined with
new and old ideas. This has caused three main issues.

The first being that the load times for the user are rather slow and unresponsive, which is a
shame, but it is to be expected with how I wrote this project.

The second being that the code is somewhat hard to read, has code that does the same
thing, and there are repeat variables that represent the same thing. This is what is causing
the first issue. As development progressed, I would learn something new, implement it, and
sometimes it would leave some old code behind, and as the semester progressed it got
worse and worse, and some design decisions from earlier now had to either be
re-implemented, or I needed to find a work-around (which is usually what I did). This means
that there are unnecessary calls to retrieve data to the server, improper uses (or lack of use)
of middleware, and some odd logic.

The third issue, which stems from the first and second, is that some of my code is written as
script tags on my templates (I know, I’m sorry!), which means that there is code everywhere,
even when it shouldn’t be there, and I didn’t get to take my templating engine as far as I
could have. The main reason for this was me having to rewrite my game logic with Socket.io,
and running out of time. Less time = more mess.

## Faulty Colour Loading:
If you load up a game to view / spectate, the colour of the header (who’s turn it is etc) is
defaulted to black when it shouldn’t be. This isn’t a major issue, but I certainly noticed it, and
like with everything else here, ran out of time to fix it.
Better Error Messages:

I was really hoping I would have enough time to implement Flash to my site because it
seemed like a pretty cool tool, but I just didn’t have the time to implement it. I instead opted
for a quick workaround of using my templating engine to render a few basic messages.

## Small UI Improvements (More Beautification!):
You can certainly tell where I ran out of time when you look at my account page, and my
game selection page. They’re pretty… boring? And could certainly use some improvements.
The pages don’t look bad, but they lack the quality that other parts of my site have.

## Proper Refreshing of Pages:
This one really bothered me but since it didn’t functionally cause any issues, I forgot about it
until it was too late. I would have liked to be able to have pages load updated templates
when needed. The examples of when my site does NOT do this are when you send a friend
request, the other user has to refresh the page to see it, and you then have to refresh the
page once they’ve accepted so that you can see it. This is the same with the game requests.
This also happens anytime a game board is updated. It’s a small quality of life improvement
but it again helps with the responsiveness and feel of the site, and overall improves the user
experience.

## Restricting What a User Can Do:
Side-stepping the fact that there are a lot of issues with having things render client-side vs.
server-side (having people modify data, etc), there are many obvious restrictions and
limitations that I would have liked to place on people. Number one is to block certain colours
from being selected (or handling when they are selected) because if a user sets their
account to a really dark colour, you won’t be able to see their chat messages clearly. One
cool part of this though, is if the user sets their colour or the opponents colour to white, it
could be like a mini-game because you wouldn’t be able to see where they placed their spot
(assuming you ignore the chat). The other thing would be email validation, and restricting
certain profanities from being used as usernames.

## Better Mobile / Browser Support:
My toe-dipping experience with trying to support other platforms (mobil, tablet, etc) and
supporting other browsers has certainly brought my attention to a lot of issues that arise for
the users of my site if they choose to use it on their unsupported or semi supported platform.
My website could certainly use a little bit of time to make everything look nice on smaller
screens, especially since I spent a lot of time making the site look nice on big screens, why
shouldn’t it look nice / more functional on smaller ones? And there is a lot to be learned for
browser support and I really didn’t dive too deep into that subject, but it seems like there is a
lot to learn from it.

## Consistent HTTP Method & Status Codes:
One of the downfalls to not knowing what you’re doing and then not taking the time to fix
what you’ve already done when you learn something new is having something that you are
ashamed of. Looking back at my code, I know that I didn’t always use the proper HTTP
methods, and instead just used whatever made the code work. This is not good practice nor
does it help with consistency. I did patch a few obvious issues of using PUT requests when I
should have been using GET requests, but for the most part, my code is riddled with
inconsistencies. The same can be said with status codes.

I do return a few status codes here and there, but there is no consistency to it. Sometimes I
would write them, other times I would forget, or not care to include them. This is something
that I need to work on and will definitely help with improving the quality of the code that I am
writing.

# **Modules, Frameworks, and Other Tools**
## Socket.io:
There were two main reasons for using socket.io: Firstly, it allowed me to easily create a
real-time chat, and secondly, it allowed me to (somewhat) easily create a real-time playable
Connect 4 game. Since socket.io is a realtime framework, it allows for real time
communication between two (or more) sockets (or users). That means real time updates,
real time messages, and real time interaction between users, which is key for a site like this!

## Nodemailer:
Nodemailer was the first module that I stumbled upon that would allow me to send an email
from my server email ( connecFTW@gmail.com ) to a user’s email. This allows me to not only
be able to send a temporary password to a user if they wish to reset it, but it could also open
the door to authenticating users when creating an account (making sure they aren’t bots).
The only real downside to this was that all of my emails get flagged and end up in the junk
folder, which is a shame. I do believe; however, that it is more my fault for the way the email
is formatted than it is Nodemailer’s fault.

## Mongoose:
Schemas were a lifesaver for this assignment. Not only does it work tightly with MongoDB to
allow easy database entry, modification, and updates, it also drastically decreased the
amount of code that I would have to write to create users, games, and chats.

## Moment:
This module allowed me to easily format the time (for when a user sends a message). It
doesn’t do anything uniquely special, or that I couldn’t have done with normal JavaScript, but
it's a handy little tool that suited my needs.

## Express:
Express is a NodeJS framework that simplifies the process of writing and testing server-side
web apps. It makes my code cleaner, simpler, and more flexible. The reason I chose to use
Express is mainly because of the simplicity that it offers, and the fact that it was required for
a few of my other modules. Express and Node.js work alongside each other to not only
increase my ability to produce code quickly, but they also simplify many processes that
might not be so easy to write, had I not used them.

## Bcrypt:
I used bcrypt because it provided me an easy way to hash passwords so that the user has
that extra level of protection against people trying to steal information for the user. Security is
very important for websites that go live, and I wanted to try and make my site a little bit more
secure by adding this hashing library.

## @Hapi/Joi:
This data validator works very similarly to Mongoose in that you can create a Schema,
define its properties, and send them off in an easily readable fashion. I used this module so
that I could validate the data that would be sent to the server anytime a user tried to create
an account or login. I created two functions, registrationValidation(data), and
loginValidation(data). Both functions take in some data, which gets parsed and converted
into a Joi object (Schema), and I can then use Joi to validate if the user entered a valid
email, a long enough username, or a long enough password. It will then return an error if it
fails to meet the specifications that I wrote for a valid username, email, or password. I can
then check if there was an error, and send out said error message to the user so that they
know why their attempt to login or register failed.

## Handlebars:
As mentioned earlier, Handlebars was the template engine that stood out to me. It’s fast,
easy to use, and allowed me to do a lot of things that might not have been so straightforward
had I used a different template engine. I really like how easy it is to write a function that I can
then put into my template, which allows me to choose what and how I will show a user a
page. One of the good parts of Handlebars is that it has a fast execution time since it
compiles the templates into JavaScript functions, so it’s a bit unfortunate that I slowed the
execution time with my quirky code. The icon is also a mustache so...

## Nodemon:
This was an absolute gem of a development tool. Nodemon is a tool that automatically
restarts the node application anytime I make changes in my JavaScript. It’s a small tool but it
allows me to run a custom development script when I want it to be used, and run the normal
start script when I don’t want it to be used.

## Open:
I found this module while looking at Nodemon, and I thought that they’d work great together.
Like I said before, I’m a lazy coder, and so, to have to click the save button, re-run the
server, and then refresh the page just seemed like an awful lot of work (possibly a slight
exaggeration). So… what can I do? Well, with Nodemon restarting the server everytime I
change stuff, I can then use Open to, well, open the page. Of course, both of these ended up
being more annoying than helpful if I’m being honest, but for the first few minutes of using
them, I thought that they were crazy useful! (I’d make a change, and a new window would
open when I didn’t want it to, and end up either closing it, or having to close 50+ tabs).

## Node.js:
Honestly, I used Node.js because that is what the project sort of demanded for. I know one
of my friends did the whole project without the use of a single module (which is quite
impressive), but it is also tedious. You have to do a lot of things that would otherwise be
covered by Node.js, and you end up doing a lot more work with the same, or possibly a
worse result. I say worse not to make you give my friend a lower grade, but because Node.js
does allow for faster, and more efficient use of resources, which you might not get by coding
everything without it. This is because of the fact that Node.js operations are performed
asynchronously, which is very important when designing a web app like this.

# **Best Features (Memorable Features):**
## Everything Works:
Honestly, I wasn’t sure if I would be able to implement all of the requirements or not, so I’m
just very happy with what I was able to do as not only my first website, but also my first
major coding project. There are (obviously, if you’ve gotten this far into the report) many
things that I would like to have done differently, many things I could improve on, and many
flaws in my code, but I am happy with what I produced, and I’m happy I get to share it with
you.

It’s hard to really truly be proud of any one feature on my site since none of it is
groundbreaking or that impressive, but like I said earlier, I’m happy with what I was able to
create for this project and I might end up fixing it up so that it runs smoother.

## Password Reset:
I know this isn’t a hard feature to implement but I still can’t stop a smile from creeping up my
face when I see an email in my junk folder containing a temporary password. And I like that
when I login, it takes me right to the account settings where I can set up a new password. I
don’t know what it is about this feature, and I wouldn’t even say it’s one of the site’s best
features, but I’d like to think that it’s a unique feature that many people probably didn’t
implement.

## Game Replay:
My game replay system, which I didn’t even realize I needed to add until the 4th is pretty
cool to watch. I guess I was kind of surprised it worked more than anything but I really like
how it goes from a completely fresh game all the way to the end, and highlights everything
like you truly are watching a replay. And to make it even better, I added a pretty neat speed
slider that allows you to adjust the speed in which the replay plays out. So you can go from
0s to 5s and anything in between.

## Profile Picture Selection:
This is another small little feature that wasn’t hard to implement, but I think it just looks pretty
great. It’s a bit of a shame that I didn’t get to showcase it better, with it being on a rather
boring looking profile settings page, but nonetheless, it looks pretty neat to click on a picture
and have it get bigger to show your selection.

## Burger (Yummy):
I don’t know why all of my “best” features aren’t really the “best” features but that’s fine.
They’re memorable. So I had no idea that the little icon in the top right of my page (when in
mobile screen size) was called a burger. It’s a funny name, but I guess I get it. Three layers,
bread, patty, bread. That’s a boring burger though… Anyways, this is the first time I’ve done
an animation so I thought it was pretty cool to add it when the burger is clicked. It looks
pretty solid and transitions quite well.

## **Page Summary & Functionality:**
#Header:
The double arrow symbol that points downwards can be clicked to view your past games.
The ConnecFTW text brings you to the main page. Each page header can be clicked.

## /login:
You can login with an account, click join to make a new account, or reset your password. If
you login with an account by using a temporary password, it will direct you to reset it.

## /resetPassword:
Enter your email and it will send you a new password (probably in your junk folder).

## /join:
You can create a new account by entering your email, desired username, and password. It
will instantly log you in once you’ve created a valid account.

## /:
You can pick whether or not to play a casual or ranked game. You can also enter a game ID
to spectate or view it. You can also see a list of game invites from friends. If you get sent
one, you MUST refresh the page (bad flaw I know).
! [homeScreen] (pictures/search.png)

## /chatroom
You can choose who you want to chat with. They must be in your friends list, and you must
be part of the chat to join it. When you add someone as a friend, it will create a chat for you
and them ONLY. If you have no friends and try and access the chatroom, it will bring you to
the friends page.
! [chat] (pictures/chat)

## /friends
You can see your friends and the status of their account is the colour that surrounds the
profile picture and the box. Green is online, yellow is away, and grey is offline. You can
search for users, send friend requests, remove friends, deny friend request and also accept
them. You can also challenge a friend to a game, message them, or view their profile. If you
get sent a friend request, you MUST refresh your page (bad flaw I know).
! [friends] (pictures/friends)

## /friends/users/:user
This page will show you any user that has the substring of your search in their own name. If
you enter nothing, it will show all users. You cannot add yourself or your friends, hence the
buttons are hidden.

## /profile/:user
You can view a users profile page. It will display their profile picture, their online status,
win/loss ratio, wins, losses, and the date in which they were last online. You can also see
their past games (up to 10) and their ongoing games (casual and ranked). Only ranked
games appear in the past 10 games. If the user is not in your friends list, you can click the
“add friend” icon to send a friend request. If they are in your friends list, you can message
them by clicking the “message” icon. If the user has a private profile, this information is
hidden. Each game is clickable.

## /account
On this page you can see your online status, win loss ratio, wins, losses, and your past 10
games (ranked). You can also change your online status with the double arrow icon beside
your online status. You can also change your profile settings by clicking the button. Each
game is clickable.
! [account] (pictures/account)

## /account/profileSettings
You can change your colour, opponents colour, public or private profile, and your profile
picture. If you leave something blank, it won’t get modified. Your colour and opponents
colour will default to the colours that your account has. This means that if you change your
colour to a specific colour, and want to modify it slightly, it is very easy.
If you have reset your password, you will see a spot to enter the emailed temporary
password and a spot to enter a new one.

## /logout
This logs you out of the account and brings you to the login page.

## /play/:gameID
This brings you to the specific game. If the game is not active, and the game has been
finished, it will bring you to the view page. If you finish a game, you can refresh the page to
bring it to the view page. On this page, you can forfeit, leave at any time and come back to it,
and you can message the users who are currently viewing the game. When the game is
over, you can hit the button to requeue, which brings you to the main page.
! [play] (pictures/play)

## /view/:gameID
You can use the slider to change the speed at which the game replays when you hit replay.
You can message anyone that is currently viewing the game.

## /lobby
You can wait up to 5 minutes for a game. Once the 5 minutes has expired, you will be
removed from the queue and sent back to the main page. You can also leave the queue by
pressing the button, or by simply clicking out of the page by going to a different one.
