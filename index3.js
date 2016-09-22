var Nightmare = require('nightmare');
var vo = require('vo');

var homeUrl = 'http://www.wimp.com/'

var findUnseenRelativeLinks = function(baseUrl, viewedLinks) {
    var markedLinks = {}
    var links = document.querySelectorAll("a");

    for (var i = 0; i < links.length; i++) {
    var href = links[i].href;
    if (!markedLinks[href] && !viewedLinks[href] && (/^\//.test(href) || href.indexOf(baseUrl) != -1)) {
        markedLinks[href] = 1;
    }
    }

    return Object.keys(markedLinks).sort();
}

function* findNewLinksToVisitFromLink(viewedLinks, url, nightmare) {
    console.log(url)
    var links = yield nightmare.goto(url).evaluate(findUnseenRelativeLinks, homeUrl, viewedLinks)
    return links;
}

function * run() {
    var nightmare = Nightmare();
    var viewedLinks = {};
    var linksToVisit = [homeUrl];

    // @TODO Refactor this section to view to a breadth first search on the new links
    var url = linksToVisit.pop()
    viewedLinks[url] = 1;
    var links = yield * findNewLinksToVisitFromLink(viewedLinks, url, nightmare);
    // end of TODO breadth first search

    console.log(links);
    yield nightmare.end();
}

vo(run)(function(err, result) {
    if (err) throw err;
});
