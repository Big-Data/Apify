var express = require("express"),
    app = express(),
    fs = require("fs"),
    jsdom = require("jsdom"),
    dbClient = require("mongodb");

var jquery = fs.readFileSync(__dirname + "/jquery-1.10.2.min.js", "utf-8");
//var jquery_xpath = fs.readFileSync(__dirname + "/jquery.xpath.min.js", "utf-8");

app.configure(function() {
  app.set("name", "jDOM");
});

// Request Logger
app.use( function (req, res, next) {
  console.log("%s %s", req.method, req.url);
  next();
});

// Static files
app.use(express.static(__dirname + '/public'));

// Body Parser (JSON & Multi-part)
app.use(express.bodyParser());

// Routes
app.post("/apify", function (req, res) {
  res.send(200);
});

app.get("/get/:hash", function (req, res) {
  res.send(200);
});

app.post("/test", function (req, res) {

  var payload = req.body;

  if(!payload) {
    res.send(400, "No payload received");
    return;
  }

  if(!payload.url) {
    res.send(400, "No url on payload");
    return;
  }

  if(!payload.xpath) {
    res.send(400, "No xpath on payload");
    return;
  }

  var xpath = payload.xpath.replace(/\/tbody/g, "");
  console.log(xpath);

  jsdom.env({ url: payload.url, src: [jquery],
    done: function (errors, window) {
      var $ = window.$;
      var document = window.document;

      var r1 = document.evaluate(xpath, document, null, 9, null);
      if(r1.singleNodeValue == null) {
        res.send("No result from xpath");
        return;
      }

      var lastElement = r1.singleNodeValue;

      console.log("Found xpath element: " + lastElement.tagName);

      var getHref = lastElement.tagName === "A" || lastElement.tagName === "IMG";

      var parentListElement = $(lastElement).closest("table, ul, ol");

      if(parentListElement.length === 0) {
        console.log("Could not find parent table, ul or ol");
        res.send({"result": textContent, "length": 1});
        return;
      }

      var parentTag = parentListElement.prop("tagName");
      console.log("parentTag: " + parentTag);

      var subxpath;
      var pattern;
      if(parentTag === "TABLE") {
        pattern = /\/tr\[[0-9]+\]/g;
      } else if (parentTag === "UL") {
        pattern = /\/li\[[0-9]+\]/g;
      } else if (parentTag === "OL") {
        pattern = /\/li\[[0-9]+\]/g;
      } else {
        res.send("Somehow found weird parentTag...");
        return;
      }

      var match, mResult;

      do {
        match = mResult;
        mResult = pattern.exec(xpath);
      } while(mResult != null);

      if(match === null) {
        res.send("Something bad in subxpath regex");
        return;
      }

      subxpath = xpath.substring(match.index + match[0].length);
      console.log("Subxpath: " + subxpath);

      var result = [];

      var childs = parentListElement.children(); 
      console.log("Parent List has " + childs.length + " children");       
      for (var i = 0; i < childs.length; i++) {
        var subElement = childs[i];
        var r2 = document.evaluate("./" + subxpath, subElement, null, 9 , null);

        if(r2.singleNodeValue != null) {
          var node = r2.singleNodeValue;

          var r = {};
          r.text = node.textContent;

          if(getHref) {
            r.href = node.href;
          }

          result.push(r);
        }
      }

      res.send({"result": result, "length": result.length});
    }
  });
});

// Error Handler
app.use(function (err, req, res, next){
  console.error(err.stack);
  res.send(500, '500 - Something broke!');
});

// Not Found
app.use(function (req, res, next){
  res.send(404, '404 - What your looking for is in "El Gara"');
});

dbClient.connect("mongodb://localhost", function (err, db) {
  if(err) {
    return console.error("Could not connect to mongodb", err);
  }

  console.log("Database connection successful");

  app.listen(8080);
  console.log("App started, listening at port %s", 8080);
});