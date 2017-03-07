var express = require('express');
var app = express();

app.use(express.static('public'));

app.set('views', './views');
app.set('view engine', 'ejs');

app.listen(3000);

var pg = require('pg');
// create a config to configure both pooling behavior
// and client options
// note: all config is optional and the environment variables
// will be read if the config is not present
var config = {
    user: 'postgres',
    database: 'christmas',
    password: '1234567a@',
    host: 'localhost',
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

//this initializes a connection pool
//it will keep idle connections open for a 30 seconds
//and set a limit of maximum 10 idle clients
var pool = new pg.Pool(config);

var bodyParser = require('body-parser');
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var multer = require('multer');
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
})

var upload = multer({ storage: storage }).single('avatar');

app.get('/', function(req, res) {
    // to run a query we can acquire a client from the pool,
    // run a query on the client, and then return the client to the pool
    pool.connect(function(err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query('select * from videos', function(err, result) {
            //call `done(err)` to release the client back to the pool (or destroy it if there is an error)
            done(err);
            if (err) {
                res.end();
                return console.error('error running query', err);
            }
            res.render('home', { data: result });
        });
    });
});

app.get('/video/list', function(req, res) {
    pool.connect(function(err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query('select * from videos', function(err, result) {
            done(err);
            if (err) {
                res.end();
                return console.error('error running query', err);
            }
            res.render('list.ejs', { data: result });
        });
    });
});

app.get('/video/delete/:id', function(req, res) {
    pool.connect(function(err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query('delete from videos where id = ' + req.params.id, function(err, result) {
            done(err);
            if (err) {
                res.end();
                return console.error('error running query', err);
            }
            res.redirect('../list');
        });
    });
});

app.get('/video/add', function(req, res) {
    res.render('add.ejs');
});

app.post('/video/add', urlencodedParser, function(req, res) {
    upload(req, res, function(err) {
        if (err) {
            // An error occurred when uploading
            res.send(err);
        } else {
            res.send('Post OK');
        }
    });
});