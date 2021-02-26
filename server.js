require('dotenv').config();
const app = require('express')();
const http = require('http').Server(app);
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

let port = process.env.PORT;
let apiRouter = require('./route');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});  
app.use('/api/v1', apiRouter);

http.listen(port, function() {
    console.log(`Listening on localhost:${port}`);
})