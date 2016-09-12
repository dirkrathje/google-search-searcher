const Phantom = require('phantom');
const sleep = require('sleep');
const url = require('url');

// https://github.com/NikolaiT/GoogleScraper/blob/master/GoogleScraper/search_engine_parameters.py

// num:  number of search results we want Google to deliver, Google delivers 100 results max
const num = 10;

// q: Acutual search query
const q = "customer+journey"
    // const q = "customer+and+journey"

// lr: Restriction of searches to pages in the specified language
const lr = ""
    // const lr = "lang_de"
    // const lr = "lang_en"

const query2_terms = ["McKinsey", "Court"]




const parameters = []

if (q) parameters.push("q=" + q)
if (num) parameters.push("num=" + q)
if (lr) parameters.push("lr=" + lr)

const searchUrl = "https://www.google.de/search?" + parameters.join("&");

console.log("Sending request.")

// array to store the pages that the Google search results link to
const resultPages = [];


var googleResultPage = null;
var phantomInstance = null;


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

        // Load all search results and search for query2
        allProperLinks.forEach((d, i) => {

            phantomInstance.createPage()
                .then(page => {
                    resultPages.push(page);
                    console.log("Opening url: " + +i + ". " + d);
                    return page.open(d);
                })
                .then(status => {
                    console.log("Response status: " + status + " (url: " + d + ")");
                    return resultPages[i].property('content');
                })
                .then(content => {

                    console.log("Searching for terms of query2 in content of " + d + ")");
                    let numberOfFoundTerms = 0;
                    query2_terms.forEach(e => {

                        if (content.indexOf(e) > -1) {
                            console.log("Found '" + e + "' at search results " + i + " (" + d + ")");
                            numberOfFoundTerms++;
                        }
                    })

                    console.log("Found " + numberOfFoundTerms + " term(s) at '" + d + "'.");


                    resultPages[i].close();
                })
        });
        // phantomInstance.exit();
    })
    .catch(error => {
        console.log(error);
        phantomInstance.exit();
    });


sleep.sleep(10)
