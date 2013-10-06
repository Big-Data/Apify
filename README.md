Apify
====

[Watch Demo](http://www.youtube.com/watch?v=NJHFt6tVRIU "Watch Demo")

Apify gathers a websties' data and serves the content in a JSON format you can GET and use to develop other web or mobile apps. This simple Chrome Extension tool does that using an [AWS EC2 Instancee](http://ec2-54-211-79-18.compute-1.amazonaws.com:8080/ "AWS EC2 Instancee"). First, the users right clicks on the content he desires, followed by the Chrome Extensions POSTing some information to the server and then the server returning an URL the user can later use to get the same type of information. If the data is contained within a  list (ul, ol) or a table Apify will find the relevant parent to give you the information across the list.

Technologies used in Hack are Node.js, MongoDB and Chrome's Extension API. Also JavaScriopt Everywhere!

Background
----------
Apify is an idea to make any website into an API. A possible idea for Web Service in which the service 'apifies' websites and provides infrastructure to serve the content. In the web service additional monitoring tools could be available to notify user if layout of scrapped webpage has changed. Apify was developed in HackMIT 2013 by two developers form Puerto Rico, [Daniel Santiago](http://github.com/danysantiago "Daniel Santiago") and [Fernando Martinez](http://github.com/crzrcn "Fernando Martinez").