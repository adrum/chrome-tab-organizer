function sortByTitle() {
  sortBy("title");
}

function sortByWebsite() {
  sortBy("url");
}

function sortByDomain() {
  sortBy("domain");
}

function closePopover() {
  window.close();
}

function getHostname(url) {
  const a = document.createElement("a");
  a.href = url;
  return a.hostname;
}

function getProp(obj, property) {
  switch (property) {
    case "title":
      return obj.title.toLowerCase();
    case "url":
      return obj.url.toLowerCase();
    case "domain":
      if (obj.url.toLowerCase().indexOf("http") > -1) {
        return obj.url.toLowerCase();
      }
      return obj.title.toLowerCase();
  }
}

function getDomainPieces(url) {
  const hostname = getHostname(url);
  const hostnameArray = hostname.split(".");

  // Stick the TLD and the domain together
  const rootDomainName = hostnameArray.slice(hostnameArray.length - 2);
  const subdomainName = hostnameArray.slice(0, hostnameArray.length - 2);

  return [...rootDomainName, ...subdomainName.reverse()];
}

function sortBy(property) {
  chrome.windows.getCurrent(function (window) {
    chrome.tabs.query({ windowId: window.id }, function (tabs) {
      var newOrder = tabs
        .sort((a, b) => {
          const propa = getProp(a, property);
          const propb = getProp(b, property);

          if (property == "domain") {
            // Extract hostname, then split by dots, then sort in reverse order
            const aHostname = getDomainPieces(propa).join(".");
            const bHostname = getDomainPieces(propb).join(".");
            console.log(aHostname, bHostname);
            return aHostname > bHostname ? 1 : -1;
          }

          return propa > propb ? 1 : -1;
        })
        .map((t) => t.id);
      chrome.tabs.move(newOrder, { index: 0 }, function () {
        // alert('Tabs Reordered.')
        closePopover();
      });
    });
  });
}

function mergeAllWindows() {
  chrome.windows.getCurrent(function (window) {
    chrome.tabs.query({ currentWindow: false }, function (tabs) {
      if (tabs.length > 0) {
        var newOrder = tabs.map((t) => t.id);
        chrome.tabs.move(
          newOrder,
          { index: -1, windowId: window.id },
          function () {
            closePopover();
          }
        );
      } else {
        closePopover();
      }
    });
  });
}

function moveToNew() {
  if (typeof browser != "undefined") {
    browser.windows.getCurrent().then(function (window) {
      browser.tabs.query({ windowId: window.id }).then(function (tabs) {
        if (tabs.length < 2) {
          closePopover();
          return;
        }
        for (var i in tabs) {
          var tab = tabs[i];
          if (!tab.active) continue;
          browser.windows.create({ tabId: tab.id }).then(function () {
            closePopover();
          });
        }
      });
    });
    return;
  }

  chrome.windows.getCurrent(function (window) {
    chrome.tabs.query({ windowId: window.id }, function (tabs) {
      if (tabs.length < 2) {
        closePopover();
        return;
      }
      for (var i in tabs) {
        var tab = tabs[i];
        if (!tab.active) continue;
        chrome.windows.create(
          { focused: true, tabId: tab.id },
          function (window) {
            closePopover();
          }
        );
      }
    });
  });
}

document.getElementById("sort-domain").addEventListener("click", sortByDomain);
document.getElementById("sort-title").addEventListener("click", sortByTitle);
document.getElementById("sort-url").addEventListener("click", sortByWebsite);
document.getElementById("merge").addEventListener("click", mergeAllWindows);
document.getElementById("move-new").addEventListener("click", moveToNew);
