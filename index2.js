const url = require('url');
const Sanitize = require("sanitize-filename");
const Fs = require("fs");
const Path = require("path");
const mkdirp = require('mkdirp');
const Nightmare = require('nightmare');

const nightmare = new Nightmare({
    show: true
});

const nightmare2 = new Nightmare({
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

var results = [];

let selector = "h3"
nightmare
    .goto(searchUrl)
    .wait()
    .evaluate(function(selector) {

        var linkArray = [];
        var links = document.querySelectorAll('h3.r a');
        for (var i = 0; i < links.length; ++i) {
            linkArray.push(links[i].getAttribute('href'));
        }
        return linkArray;
    }, selector) // <-- that's how you pass parameters from Node scope to browser scope
    .end()
    .then(function(urls) {
        console.log(urls)

        urls.reduce(function(accumulator, url) {

            return accumulator.then(function(results) {
                console.log(url)
                return nightmare.goto(url + "gfjhasgfjhsg")
                    .wait('body')
                    .title()
                    .then(function(result) {
                        console.log(result)
                        results.push(result);
                        return results;
                    })
                    .catch(function(error) {
                        console.error('error:', error);
                    });
            });
        }, Promise.resolve([])).then(function(results) {
            console.log("XXX");
            console.dir(results);
        });


    })
    .catch(function(error) {
        console.error('Search failed:', error);
    });
