/**
 * Created by Administrator on 2016/9/17.
 */
var Chat = function (socket) {
    this.socket = socket;
};

Chat.prototype.sendMsg = function(room,text){
    var msg = {
        room:room,
        text:text
    }
    this.socket.emit("message",msg);
};

Chat.prototype.changeRoom = function (room) {
    this.socket.emit("join",{
        newRoom:room
    });
};

Chat.prototype.processConmmand = function (conmmand) {
    var words = conmmand.split(" ");
    var conmmand = words[0].substring(1,words[0].length).toLowerCase();
    var msg = false;

    switch (conmmand){
        case "join":
            words.shift();
            var room = words.join(" ");
            this.changeRoom(room);
            break;
        case "nick":
            words.shift();
            var name = words.join(" ");
            this.socket.emit("nameAttempt",name);
            break;
        default:
            msg = "未知命令";
            break;
    }

    return msg;
};
