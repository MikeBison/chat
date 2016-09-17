/**
 * Created by Administrator on 2016/9/17.
 */
var socketio = require("socket.io");
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function (server) {
    io = socketio.listen(server); //启动socketio服务器,搭载在已有的httpserver上;

    io.set("log　level",1);

    io.sockets.on("connection",function (socket) {
        guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed); //用户连接时为其赋一个访客名

        joinRoom(socket,"大厅");//首次访问把用户放到大厅中

        handleMessageBroadcasting(socket,nickNames);//处理用户消息,用户昵称变更,房间变更

        handleNameChangeAttempts(socket,nickNames,namesUsed);

        handleRoomJoining(socket);

        socket.on("rooms",function () {//用户发送消息时候,向其提供被占用的聊天室列表
            socket.emit("rooms",io.sockets.manager.rooms);
        });

        handleClientDisconnection(socket,nickNames,namesUsed);
    })
};

function assignGuestName(socket,guestNumber,nickNames,namesUsed) {
    var name = "游客" + guestNumber;
    nickNames[socket.id] = name;
    socket.emit("nameResult",{
        success:true,
        name:name
    });
    namesUsed.push(name);
    return guestNumber + 1;
}

function joinRoom(socket,room) {//加入房间
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit("joinResult",{
        room:room
    });
    socket.broadcast.to(room).emit("message",{
        text:nickNames[socket.id] + "加入了房间" + room + "."
    });

    var usersInRoom = io.sockets.clients(room);
    if(usersInRoom.length > 1){
        var usersInRoomSummary = "用户当前房间为" + room + ".";
        for(var index in usersInRoom){
            var userSocketId = usersInRoom[index].id;
            if (userSocketId !== socket.id){
                if(index > 0){
                    usersInRoomSummary += ",";
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += ".";
        socket.emit("message",{
            text:usersInRoomSummary
        });
    }
}

function handleNameChangeAttempts(socket,nickNames,namesUsed) {//更改昵称
    socket.on("nameAttempt",function (name) {
        if(name.indexOf("游客") === 0){
            socket.emit("nameResult",{
                success:false,
                message:"用户昵称不能以'游客'开头"
            })
        }else{
            if(namesUsed.indexOf(name) === -1){
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit("nameResult",{
                    success:true,
                    name:name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit("message",{
                    text:previousName + "更名为" + name + "."
                });
            }else{
                socket.emit("nameResult",{
                    success:false,
                    message:"昵称已被占用"
                })
            }
        }
    })
}

function handleMessageBroadcasting(socket) {//发送聊天消息
    socket.on("message",function (message) {
        socket.broadcast.to(message.room).emit("message",{
            text: nickNames[socket.id] + ":" + message.text
        })
    })
}

function handleRoomJoining(socket) {//创建房间
    socket.on("join",function (room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket,room.newRoom);
    })
}

function handleClientDisconnection(socket) {//用户断开连接
    socket.on("disconnection",function () {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    })
}