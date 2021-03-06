chrome.contextMenus.create({
  "title":"Apify it!",
  "contexts":["all"],
  "onclick": sendPayload
});

function sendPayload(info, tab) {
  chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {"method": 'getElement'}, function (response) {
      if (response) {
        console.log(response);
        var post = new XMLHttpRequest();
        post.onreadystatechange = function() {
          console.log(post);
          if (post.readyState === 4){
            var res = JSON.parse(post.responseText);
            console.log(res);

            window.open(res.url)
          }
        };
        post.open("POST", "http://ec2-54-211-79-18.compute-1.amazonaws.com:8080/apify", true);
        post.setRequestHeader("Content-Type", "application/json");
        post.send(JSON.stringify(response));
      }
    });
  });
}