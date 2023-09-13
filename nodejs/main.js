const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const db = new sqlite3.Database('shorturls.db');
const fs = require('fs');

const jsonData = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const domain = jsonData.website_domain;

app.use(express.static('public'));

// create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS urls (
    real_url TEXT NOT NULL,
    shortened_url TEXT NOT NULL
  )
`);

async function refineUrl(url) {
    const httpRegex = /^http?:\/\//i;
    if (!httpRegex.test(url)) {
        url = 'http://' + url;
    }
    return url;
}

async function shorten(url) {
    url = await refineUrl(url);
    let n = 6;
    while (true) {
        const sha256Hash = crypto.createHash('sha256');
        sha256Hash.update(url);
        let shortId = sha256Hash.digest('hex').substring(0, n);
        console.log(shortId);
        const row = await new Promise((resolve, reject) => {
            db.get('SELECT real_url FROM urls WHERE shortened_url = ?', [shortId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
        if (row && row.real_url===url) {
            return shortId;
        }
        if (!row) {
            db.run('INSERT INTO urls (real_url, shortened_url) VALUES (?, ?)', [url, shortId]);
            return shortId;
        }
        n++;            
    }
}

async function getOriginalUrl(shortId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT real_url FROM urls WHERE shortened_url = ?', [shortId], (err, row) => {
            if (err) {
                reject(err);
            } else if (row && row.real_url) {
                resolve(row.real_url);
            } else {
                resolve(null);
            }
        });
    });
}


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <style>
        form {
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }
          
          input[type="text"] {
            width: 95%;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ccc;
            border-radius: 3px;
          }
          
          input[type="submit"] {
            display: block;
            width: 100%;
            padding: 10px;
            background-color: #007bff;
            color: #fff;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          
          input[type="submit"]:hover {
            background-color: #0056b3;
          }
        </style>          
    </head>
    <body>
        <form action="/shorten" method="post">
            <input type="text" name="url" placeholder="Enter URL to shorten" />
            <input type="submit" value="Shorten" />
        </form>
    </body>
    </html>
  `);
});


app.post('/shorten', async (req, res) => {
    const originalUrl = req.body.url;
    const shortId = await shorten(originalUrl);

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    text-align: center;
                    background-color: #f0f0f0;
                    padding: 20px;
                }
                p {
                    font-size: 18px;
                }

                a {
                    color: #007bff;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <p>Shortened URL: <a href="${domain}/${shortId}">${domain}/${shortId}</a></p>
        </body>
        </html>
    `);
});


app.get('/:short', async(req, res) => {
    const shortId = req.params.short;

    // find in db
    const originalUrl = await getOriginalUrl(shortId);
    console.log(originalUrl);
    if (!originalUrl) {
        res.status(404).send('The URL does not exist');
        return;
    }
    res.redirect(originalUrl);
});

// Start the Express server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
