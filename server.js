/**
 * Created by Administrator on 2016/9/17.
 */
var http = require("http");
var fs = require("fs");
var path = require("path");
var mime = require("mime");
var cache = {};

function send404(res) {
    res.writeHead(404,{
        "content-type":"text/plain"
    });
    res.write("Pages not found.");
    res.end();
}

function sendFile(res,filePath,fileContents) {
    res.writeHead(200,{
        "content-type":mime.lookup(path.basename(filePath))
    });
    res.end(fileContents);
}

function staticFileServer(res,cache,absPath) {
    if (cache[absPath]){
        sendFile(res,absPath,cache[absPath]);
    }else{
        fs.exists(absPath,function (exists) {
            if (exists){
                fs.readFile(absPath,function (err,data) {
                    if(err){
                        send404(res);
                    }else{
                        cache[absPath] = data;
                        sendFile(res,absPath,data);
                    }
                })
            }else{
                send404(res);
            }
        })
    }
}

var server = http.createServer(function (req,res) {
    var filePath = false;

    if(req.url === "/"){
        filePath = "public/index.html";
    }else{
        filePath = "public" + req.url;
    }

    var absPath = "./" + filePath;
    staticFileServer(res,cache,absPath);
}).listen(3000,function () {
    console.log("server is running at port 3000");
});

var chatServer = require("./lib/chat_server.js");
chatServer.listen(server);