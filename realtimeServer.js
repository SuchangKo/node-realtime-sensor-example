//TODO: read the port from heroku

var http = require('http'), 
    fs = require('fs'),
    qs = require('querystring');
var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost',27017,{auto_reconnect:true});
db = new Db('sensordb',server);

db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'sensordb' database");
        db.collection('sensordb', {safe:true}, function(err, collection) {
            if (err) {
                console.log("The 'sensordb' collection doesn't exist. Creating it with sample data...");
                //populateDB();
            }
        });
    }
});

    
var currentTemperature;

var port = process.env.PORT || 1337;

var indexHtml = fs.readFileSync(__dirname + '/web-content/index.html');

var server = http.createServer(function (req, res) {
    if(req.url === '/sensor'){
        if(req.method === 'POST'){
            var data = '';
            req.on('data',function(s){
                //console.log("log : "+s);
		data += s; 
            });
            req.on('end',function(){
		var postdata = qs.parse(data);
		//console.log("data : "+postdata['val']);		
		//currentTemperature = JSON.parse(data);
		//console.log(jsonObj.val);
		currentTemperature = postdata['val'];
		currentTemperature *= 1; 
                console.log('updated temperature to',currentTemperature);
		
		
var sensordata = {
	value : currentTemperature
}

db.collection('sensordb', function(err, collection) {
    collection.insert(sensordata, {safe:true}, function(err, result) {
        if (err) {
            //res.send({'error':'An error has occurred'});
        } else {
            console.log('Success: ' + JSON.stringify(result[0]));
            //res.send(result[0]);
		}
	});
});

                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(currentTemperature));
		
                //send out to websocket
                if(websocket){
                   io.sockets.emit('sensor', currentTemperature);
                }
            });
        }else{
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(currentTemperature));
        }
    }else if(req.url === '/' || req.url === '/index.html'){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(indexHtml);
    }else{
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Resource not found\n');
    }
});

server.listen(port);
console.log('Server running at',port);

var io = require('socket.io').listen(server);
var websocket;

io.sockets.on('connection', function (socket) {
    socket.join('sensor');
    websocket = socket;
});
