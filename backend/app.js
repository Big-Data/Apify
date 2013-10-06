var express = require("express"),
    app = express(),
    fs = require("fs"),
    jsdom = require("jsdom"),
    url = require("url"),
    dbClient = require("mongodb"),
    ObjectID = dbClient.ObjectID;

var jquery = fs.readFileSync(__dirname + "/jquery-1.10.2.min.js", "utf-8");
//var jquery_xpath = fs.readFileSync(__dirname + "/jquery.xpath.min.js", "utf-8");

function magic(payload, res) {
  var xpath = payload.xpath;
  xpath = xpath.replace(/\/tbody/g, "");
  xpath = xpath.replace(/\/tr\//g, "/tr[1]/");
  xpath = xpath.replace(/\/li\//g, "/li[1]/");
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
        res.send({"result": lastElement.textContent, "length": 1});
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
            r.src = node.src;
          }

          result.push(r);
        }
      }

      res.send({"result": result, "length": result.length});
    }
  });
}

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

var _db;
app.use(function (req, res, next) {
  req.db = _db;
  next();
});

//Allows CORS
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
});

// Routes
app.post("/apify", function (req, res, next) {
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

  var collection = req.db.collection("apis");
  collection.insert(payload, function (err, api) {
    if(err) {
      next(err);
      return;
    }

    api = api[0];
    console.log(api);

    var locationUrl = url.format({
      "protocol": "http",
      "hostname": req.host,
      "port": 8080,
      "pathname": "/get/" + api._id
    });

    res.set({"Location": locationUrl});
    res.send(201, {"url": locationUrl});
  });
});

app.get("/get/:hashid", function (req, res, next) {
  var collection = req.db.collection("apis");
  collection.findOne({"_id": new ObjectID(req.params.hashid)}, function (err, api) {
    if(!api) {
      res.send(404);
      return;
    }

    magic(api, res);
  });
});

app.post("/test", function (req, res) {
  magic(req.body, res);
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

dbClient.connect("mongodb://localhost/test", function (err, db) {
  if(err) {
    return console.error("Could not connect to mongodb", err);
  }

  _db = db;

  console.log("Database connection successful");

  app.listen(8080);
  console.log("App started, listening at port %s", 8080);
});