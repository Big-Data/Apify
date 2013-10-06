chrome.contextMenus.create({
  "title":"Preview DOM data",
  "contexts":["all"],
  "onclick": sendPayload
});

function sendPayload(info, tab) {
  chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {"method": 'getElement'}, function (response) {
      if (response) {
        console.log(response);
        var post = new XMLHttpRequest("http://localhost/apify");
        post.open("POST", "", true);
        post.setRequestHeader("Content-Type", "application/json");
        post.send(JSON.stringify(response));
        post.onloadend = function(data) {
          console.log(data);
        };
      }
    });
  });
}