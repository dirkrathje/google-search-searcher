const Phantom = require('phantom');
const url = require('url');
const Sanitize = require("sanitize-filename");
const Fs = require("fs");

// https://github.com/NikolaiT/GoogleScraper/blob/master/GoogleScraper/search_engine_parameters.py

// query1: first search query for Google Search
const query1 = "customer+journey"
    // const query1 = "customer+and+journey"

// num:  number of search results we want Google to deliver, Google delivers 100 results max
const num = 50;

// lr: Restriction of searches to pages in the specified language
const lr = ""
    // const lr = "lang_de"
    // const lr = "lang_en"

// query2_terms: terms of second search for the search results
const query2_terms = ["McKinsey", "Court"]




const parameters = []

if (query1) parameters.push("q=" + query1)
if (num) parameters.push("num=" + num)
if (lr) parameters.push("lr=" + lr)

const searchUrl = "https://www.google.de/search?" + parameters.join("&");

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
        const allProperLinks = allLinks.filter(d => d.indexOf("http") === 0);

        result.searchResults = [];
        let promises = [];

        allProperLinks.forEach((d, i) => {
            result.searchResults[i] = {}

            promises.push(phantomInstance.createPage()
                .then(page => {
                    resultPages.push(page);
                    result.searchResults[i].url = d;

                    console.log("Opening url: " + i + ". " + d);
                    return page.open(d);
                })
                .then(status => {
                    console.log("Response status: " + status + " (url: " + d + ")");
                    return resultPages[i].property('content');
                })
                .then(content => {

                    // result.searchResults[i].content = content;
                    result.searchResults[i].searchResults = [];

                    console.log("Searching for terms of query2 in content of " + d + ")");
                    let numberOfFoundTerms = 0;
                    query2_terms.forEach(e => {

                        let searchResult = {};
                        result.searchResults[i].searchResults.push(searchResult);
                        searchResult.term = e;
                        searchResult.found = false;

                        if (content.indexOf(e) > -1) {
                            searchResult.found = true;
                            console.log("Found '" + e + "' at search results " + i + " (" + d + ")");
                            numberOfFoundTerms++;
                        }
                    })

                    console.log("Found " + numberOfFoundTerms + " term(s) at '" + d + "'.");

                    // return resultPages[i].close();
                })
            )

        })

        return Promise.all(promises)

    })
    .then(promiseAll => {
        let json = JSON.stringify(result, null, "  ");
        console.log(json);

        Fs.writeFileSync(Sanitize(searchUrl + ".json"), json)


        phantomInstance.exit();
    })
    .catch(error => {
        console.log(error);
        phantomInstance.exit();
    });
