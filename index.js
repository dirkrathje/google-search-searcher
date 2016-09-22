const Phantom = require('phantom');
const url = require('url');
const Sanitize = require("sanitize-filename");
const Fs = require("fs");
const Path = require("path");
const mkdirp = require('mkdirp');
const Nightmare = require('nightmare');

const nightmare = new Nightmare({
    show: true
});

// https://github.com/NikolaiT/GoogleScraper/blob/master/GoogleScraper/search_engine_parameters.py

// query1: first search query for Google Search
const query1 = "customer+journey"
    // const query1 = "customer+and+journey"

// num:  number of search results we want Google to deliver, Google delivers 100 results max
const num = 10;

// lr: Restriction of searches to pages in the specified language
const lr = "lang_en"
    // const lr = "lang_de"
    // const lr = "lang_en"

// query2_terms: terms of second search for the search results
const query2_terms = ["McKinsey", "Court"]



const parameters = []

if (query1) parameters.push("q=" + query1)
if (num) parameters.push("num=" + num)
if (lr) parameters.push("lr=" + lr)

const searchUrl = "https://www.google.de/search?" + parameters.join("&");

const resultPath = "result/" + (new Date()) + query1 + "_" + num + "_" + lr;
mkdirp(resultPath);

// array to store the pages that the Google search results link to
const resultPages = [];

const result = {};


var googleResultPage = null;
var phantomInstance = null;

console.log("Creating PhantomJS instance ...")
console.log("searchUrl", searchUrl)
Phantom.create()
    .then(instance => {

        console.log("PhantomJS instance has been successfully created.")
        phantomInstance = instance;
        return instance.createPage();
    })
    .then(page => {
        console.log("PhantomJS page object has been successfully created.")

        googleResultPage = page;
        googleResultPage.setting.javascriptEnabled = false;
        result.googleSearchUrl = searchUrl;
        result.date = new Date();
        console.log("Opening url: " + searchUrl)
        return page.open(searchUrl);
        // return page.open('google-result/2016-09-11-1900.htm');

    })
    .then(status => {
        console.log("Status of response to request: " + status)

        console.log("Collecting the href-targets of all links given by DOM selector 'h3.r a'")
        return links = googleResultPage.evaluate(function() {
            return [].map.call(document.querySelectorAll("h3.r a"), function(link) {
                return link.getAttribute('href');
            });
        });
    })
    .then(hrefs => {

        console.log("Getting q-parameter of collected hrefs")
        const allLinks = hrefs.map(d => url.parse(d, true).query.q);

        console.log("Filtering links starting with 'http' (this removes links to Google Search)")
        const allProperLinks = allLinks.filter((d, i) => i > 0 && d.indexOf("http") === 0);

        result.searchResults = [];

        let promises = [];
        allProperLinks.forEach((d, i) => {

            let searchResult = {}
            searchResult.url = d;
            searchResult.query2TermsFound = [];
            result.searchResults[i] = searchResult

            let resultFolder = Path.join(resultPath, Sanitize(i + "-" + d))
            mkdirp(resultFolder);

            let selector = "body";
            promises.push(
                nightmare
                .goto(d)
                .wait()
                // .html(Path.join(resultFolder, "content.html"))
                .evaluate(function() {
                    return document.querySelector('body').innerText;
                }, function(res) {
                    console.log(res)
                })
                .run(function(err, nightmare) {
                    Fs.writeFileSync(Path.join(resultFolder, "result.json"), JSON.stringify(result.searchResults[i], null, "  "));
                    if (err) return console.log(err);
                    console.log('Done!');
                })
            )
        });

        return Promise.all(promises)
    })
    .then(promises => {
        let json = JSON.stringify(result, null, "  ");
        Fs.writeFileSync(Path.join(Sanitize(searchUrl + ".json")), json)
        phantomInstance.exit();


    })
    .catch(error => {
        console.log(error);
        phantomInstance.exit();
    });
