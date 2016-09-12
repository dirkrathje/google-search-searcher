# google-search-searcher
Node.js script that searches Google search results to a query Q1 for terms of a query Q2

# Usage

1. Clone repository
2. `npm init`
2. `node index.js`

# Adpation to your needs

```


// query1: first search query for Google Search
const query1 = "customer+journey"
    // const query1 = "customer+and+journey"

// num:  number of search results we want Google to deliver, Google delivers 100 results max
const num = 10;

// lr: Restriction of searches to pages in the specified language
const lr = ""
    // const lr = "lang_de"
    // const lr = "lang_en"

// query2_terms: terms of second search for the search results
const query2_terms = ["McKinsey", "Court"]





```
