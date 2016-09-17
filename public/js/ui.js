/**
 * Created by Administrator on 2016/9/17.
 */
function divEscapedContentElement(message) {
    return $("<div></div>").text(message);
}

function divSystemContentElement(message) {
    return $("<div></div>").html("<i>" + message + "</i>");
}

function processUserInput(chatApp,socket) {
    var msg = $("#sendMsg").val();
    var systemMessage;

    if(msg.charAt(0) === "/"){
        systemMessage = chatApp.processConmmand(msg);
        if (systemMessage){
            $("#msg").append(divSystemContentElement(systemMessage));
        }
    }else{
        chatApp.sendMsg($("#room").text(),msg);
        $("#msg").append(divEscapedContentElement(msg));
        $("#msg").scrollTop($("#msg").prop("scrollHeight"));
    }
    $("#sendMsg").val("");
}

var socket = io.connect();

$(document).ready(function () {
    var chatApp = new Chat(socket);

    socket.on("nameResult",function (result) {
        var msg;
        if(result.success){
            msg = "你现在的昵称是" + result.name + ".";
        }else{
            msg = result.message;
        }
        $("#msg").append(divSystemContentElement(msg));
    })

    socket.on("joinResult",function (result) {
        $("#room").text(result.room);
        $("#msg").append(divSystemContentElement("房间变更"));
    })

    socket.on("message",function (msg) {
        var newElement = $("<div></div>").text(msg.text);
        $("#msg").append(newElement);
    })

    socket.on("rooms",function (rooms) {
        $("#room-list").empty();

        for(var room in rooms){
            room = room.substring(1,room.length);
            if (room !== ""){
                $("#room-list").append(divEscapedContentElement(room));
            }
        }

        $("#room-list div").click(function () {
            chatApp.processConmmand("/join " + $(this).text());
            $("#sendMsg").focus();
        })
    });

    setInterval(function () {
        socket.emit("rooms");
    },1000);

    $("#sendMsg").focus();

    $("#sendForm").submit(function () {
        processUserInput(chatApp,socket);
        return false;
    })
});