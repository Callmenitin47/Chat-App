function formatDate() {
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var currentDate = new Date();
    var day = currentDate.getDate();
    var month = months[currentDate.getMonth()];
    var hours = ('0' + currentDate.getHours()).slice(-2);
    var minutes = ('0' + currentDate.getMinutes()).slice(-2);
    return day + " " + month + " " + hours + ":" + minutes;
}

$(document).ready(function() {
    $.ajax({
        url: '/fetchmessages',
        method: 'POST',
        success: function(response) {
            response.forEach(function(item) {
                var div = document.createElement('div');
                div.className = 'conversation active';
                div.setAttribute('user-username', item._id);
                div.setAttribute('user-fullname', item.fullname);
                div.setAttribute('user-dp', item.dp);

                var img = document.createElement('img');
                img.src = '/static/files/' + item.dp;
                img.alt = 'Profile Picture';
                img.className = 'profile-pic';
                img.setAttribute("id", "userdp-" + item._id);

                var divInfo = document.createElement('div');
                divInfo.className = 'conversation-info';

                var spanUsername = document.createElement('span');
                spanUsername.className = 'username';
                spanUsername.textContent = item.fullname;

                var spanUnreadCount = document.createElement('span');
                spanUnreadCount.className = 'unread-messages';
                spanUnreadCount.textContent = item.unreadCount;

                var spanBio = document.createElement('span');
                spanBio.style.display = "none"
                spanBio.textContent = item.bio;
                spanBio.setAttribute("id", "userbio-" + item._id);

                var pLastMessage = document.createElement('div');
                pLastMessage.className = 'last-message';
                pLastMessage.textContent = item.lastMessage;

                var datetime = document.createElement('div')
                datetime.textContent = item.lastMessage_datetime;
                datetime.className = "mesg-time";

                divInfo.appendChild(spanUsername);
                divInfo.appendChild(spanUnreadCount);
                divInfo.appendChild(pLastMessage);
                divInfo.appendChild(spanBio);
                divInfo.appendChild(datetime);


                div.appendChild(img);
                div.appendChild(divInfo);
                div.addEventListener('click', function() {
                    var username = item._id;
                    document.getElementById('receiver-id').value = item._id;
                    var unreadMessagesElement = div.querySelector('.unread-messages');
                    unreadMessagesElement.textContent = '0';
                    document.getElementById("peer-section").style.display = "block";
                    document.getElementById("peer-section").setAttribute("user-usernames", item._id);
                    document.getElementById("my-input-area").style.display = "block";
                    document.getElementById("peer-fullname").textContent = item.fullname;
                    document.getElementById("my-peer-dp").src = '/static/files/' + item.dp;

                    updateMessages();
                });

                document.getElementById("heregoestheconv").appendChild(div);

            });
        },
        error: function(xhr, status, error) {
            console.error('Request failed with status ' + status);
        }
    });

});



function updateMessages() {
    document.getElementById('conv-area').innerHTML = '';

    var rid = document.getElementById('receiver-id').value;
    console.log(JSON.stringify({
        'rid': rid
    }))
    $.ajax({
        url: '/getmessages',
        type: 'POST',
        data: JSON.stringify({
            'rid': rid
        }),
        contentType: 'application/json',
        success: function(response) {

            response.forEach(function(item) {
                var nextclass;
                if (item.sent == 'yes') {
                    nextclass = "sent";
                } else {
                    nextclass = "received";
                }

                div = document.createElement('div');
                div.classList.add("conversation", nextclass);
                par = document.createElement('div');
                par.textContent = item.content;
                par.className = 'message';
                par_time = document.createElement('div');
                par_time.textContent = item.datetime
                par_time.className = 'mesg-time';
                div.appendChild(par);
                par.appendChild(par_time);
                document.getElementById("conv-area").appendChild(div);

                var chatWindow = document.getElementById("conv-area");
                chatWindow.scrollTop = chatWindow.scrollHeight;

            });
        },
    });
}




const socket = io('http://localhost:5000'); 

socket.on('connect', () => {
    const myId = document.getElementById('sender-id').value;
    socket.emit("roomId", myId); //
});

var messageForm = document.getElementById("mesgform");

messageForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const myId = document.getElementById('sender-id').value;
    const receiverId = document.getElementById('receiver-id').value;
    const message = document.getElementById('send-mesg').value;
    div = document.createElement('div');
    div.classList.add("conversation", "sent");
    par = document.createElement('div');
    par.textContent = message;
    par.className = 'message';
    par_time = document.createElement('div');
    par_time.textContent = formatDate()
    par_time.className = 'mesg-time';
    div.appendChild(par);
    par.appendChild(par_time);
    document.getElementById("conv-area").appendChild(div);
    document.getElementById("conv-area").appendChild(div);


    socket.emit('message', {
        'sid': myId,
        'rid': receiverId,
        'message': message
    });

    document.getElementById('send-mesg').value = "";

    var divWithAttribute = document.querySelector("div[user-username='" + receiverId + "']");

    if (divWithAttribute) {
        divWithAttribute.parentNode.removeChild(divWithAttribute);
    }

    var chatWindow = document.getElementById("conv-area");
    chatWindow.scrollTop = chatWindow.scrollHeight;
    fetchforone(receiverId, myId);

});




function fetchforone(sid, rid) {
    $.ajax({
        url: '/fetchforone',
        type: 'POST',
        data: JSON.stringify({
            'sid': rid,
            'rid': sid
        }),
        contentType: 'application/json',
        success: function(item) {
            var div = document.createElement('div');
            div.className = 'conversation active';
            div.setAttribute('user-username', item._id);
            div.setAttribute('user-fullname', item.fullname);
            div.setAttribute('user-dp', item.dp);

            var img = document.createElement('img');
            img.src = '/static/files/' + item.dp;
            img.alt = 'Profile Picture';
            img.className = 'profile-pic';
            img.setAttribute("id", "userdp-" + item._id);

            var divInfo = document.createElement('div');
            divInfo.className = 'conversation-info';

            var spanUsername = document.createElement('span');
            spanUsername.className = 'username';
            spanUsername.textContent = item.fullname;

            var spanUnreadCount = document.createElement('span');
            spanUnreadCount.className = 'unread-messages';
            spanUnreadCount.textContent = item.unreadCount;

            var spanBio = document.createElement('span');
            spanBio.style.display = "none"
            spanBio.textContent = item.bio;
            spanBio.setAttribute("id", "userbio-" + item._id);

            var pLastMessage = document.createElement('div');
            pLastMessage.className = 'last-message';
            pLastMessage.textContent = item.lastMessage;

            var datetime = document.createElement('div')
            datetime.textContent = item.lastMessage_datetime;
            datetime.className = "mesg-time";

            divInfo.appendChild(spanUsername);
            divInfo.appendChild(spanUnreadCount);
            divInfo.appendChild(pLastMessage);
            divInfo.appendChild(spanBio);
            divInfo.appendChild(datetime);


            div.appendChild(img);
            div.appendChild(divInfo);

            div.addEventListener('click', function() {
                var username = item._id;
                document.getElementById('receiver-id').value = item._id;
                var unreadMessagesElement = div.querySelector('.unread-messages');
                unreadMessagesElement.textContent = '0';
                document.getElementById("my-input-area").style.display = "block";
                document.getElementById("peer-section").style.display = "block";
                document.getElementById("peer-fullname").textContent = item.fullname;
                document.getElementById("my-peer-dp").src = '/static/files/' + item.dp;
                updateMessages();
            });
            var parentDiv = document.getElementById('heregoestheconv');
            var firstChild = parentDiv.firstChild;
            parentDiv.insertBefore(div, firstChild);
        },
    });
}


socket.on('message', (data) => {
    var sid = data['sid']
    var rid = data['rid']
    var cont = data['message']
    c_rid = document.getElementById("receiver-id").value;
    if (c_rid == sid) {

        div = document.createElement('div');
        div.classList.add("conversation", "received");
        par = document.createElement('div');
        par.textContent = cont;
        par.className = 'message';
        par_time = document.createElement('div');
        par_time.textContent = formatDate()
        par_time.className = 'mesg-time';
        div.appendChild(par);
        par.appendChild(par_time);
        document.getElementById("conv-area").appendChild(div);
        document.getElementById("conv-area").appendChild(div);


        $.ajax({
            url: '/sendread',
            type: 'POST',
            data: JSON.stringify({
                'sid': sid,
                'rid': rid
            }),
            contentType: 'application/json',
            success: function(item) {
                console.log("fine")

            }
        });
    }

    var divWithAttribute = document.querySelector("div[user-username='" + sid + "']");

    if (divWithAttribute) {
        divWithAttribute.parentNode.removeChild(divWithAttribute);
    }
    fetchforone(sid, rid)
    console.log("Received message:", data); // Replace with UI update logic
});

function hidepane() {
    document.getElementById("search-container").style.display = "none";
}

function showpane() {
    document.getElementById("search-container").style.display = "block";
}

function hidegroupbar() {
    document.getElementById("group-container").style.display = "none";
}

function showgroupbar() {
    document.getElementById("group-container").style.display = "block";
    var screenWidth = screen.width * 0.3 * 0.4;

    document.getElementById('group-img').style.width = screenWidth + "px";

    document.getElementById('group-img').style.height = screenWidth + "px";
}

function newConversation(event) {
    event.preventDefault();
    rid = document.getElementById('search-username').value;
    sid = document.getElementById('myID').value;
    content = document.getElementById('new-mesg').value;

    $.ajax({
        url: '/searchusers',
        type: 'POST',
        data: JSON.stringify({
            'rid': rid
        }),
        contentType: 'application/json',
        success: function(response) {

            if (response.resp == 'User not found') {
                document.getElementById("myresponse").innerHTML = response.resp;
            } else {

                socket.emit('message', {
                    'sid': sid,
                    'rid': rid,
                    'message': content
                });
                fetchforone(rid, sid)
                document.getElementById('search-username').value = ""
                document.getElementById('new-mesg').value = "";
                document.getElementById("myresponse").innerHTML = "";
                document.getElementById("search-container").style.display = "none";
            }
        },
        error: function(xhr, status, error) {
            document.getElementById("myresponse").innerHTML = error;
        }

    });

}

function hideprofile() {
    document.getElementById("user-profile-data").style.display = "none";
}

function showbio() {
    document.getElementById("user-profile-data").style.display = "block";
    var rid = document.getElementById("receiver-id").value;
    var bio = document.getElementById("userbio-" + rid).innerHTML;
    document.getElementById("user-profile-about").innerHTML = bio;
    document.getElementById("user-profile-dp").src = document.getElementById("userdp-" + rid).src;
}

function showsearchbar() {
    document.getElementById("search-container").style.display = "block";
}

function hidesearchbar() {
    document.getElementById("search-container").style.display = "none";
    document.getElementById('here-goes-the-result').innerHTML = "";
}

function searchUser(event) {
    event.preventDefault();
    document.getElementById('here-goes-the-result').innerHTML = "";
    document.getElementById("myresponse").innerHTML = "";
    var rid = document.getElementById("search-username").value;
    $.ajax({
        url: '/searchuser',
        type: 'POST',
        data: JSON.stringify({
            'rid': rid
        }),
        contentType: 'application/json',
        success: function(response, status, xhr) {
            div = document.createElement('div');
            div.className = "search-result";

            img = document.createElement('img');
            img.src = "/static/files/" + response.dp;
            img.setAttribute("id", "searched-user-dp");

            sdiv = document.createElement('div');
            sdiv.setAttribute("id", "searched-fullname");
            sdiv.textContent = response.fullname;

            div.appendChild(img);
            div.appendChild(sdiv);
            document.getElementById('here-goes-the-result').appendChild(div);
            div.addEventListener('click', function() {

                var username = response.username;
                document.getElementById('receiver-id').value = username;
                document.getElementById("peer-section").style.display = "block";
                document.getElementById("peer-section").setAttribute("user-usernames", response.username);
                document.getElementById("my-input-area").style.display = "block";
                document.getElementById("peer-fullname").textContent = response.fullname;
                document.getElementById("my-peer-dp").src = '/static/files/' + response.dp;

                updateMessages();
                hidesearchbar();
            });
        },
        error: function(xhr, status, error) {
            document.getElementById("myresponse").innerHTML = "User not found";
        }

    });

}