from flask import Flask,redirect,session,render_template,request,jsonify
from pymongo import MongoClient
import random
import os
from flask_socketio import SocketIO, send, join_room
from flask_cors import CORS
import datetime
from bson.objectid import ObjectId

MongoDB_user=""
MongoDB_password=""

client = MongoClient('mongodb://localhost:27017/')
db=client['chat']
users=db['users']
chats=db['messages'] 
groupchats=db['groupmessages'] 
groups=db['groups'] 
app=Flask(__name__)
app.secret_key="enufwbqbiuwefbwebfuwergbfyewrgbuewrgbuyrbbwueuwen"
app.config['UPLOAD_FOLDER'] = '/static/files'
socketio = SocketIO(app,cors_allowed_origins='*')
cors = CORS(app, resources={"/socketio.io": {"origins": ["http://localhost:5000"]}}) 

@socketio.on('message')
def handle_message(mesg):
	data={}
	data['sender']=mesg['sid'];
	data['receiver']=mesg['rid'];
	data['content']=mesg['message'];
	data['status']="unread"
	data['time']=datetime.datetime.now()
	chats.insert_one(data);
	socketio.emit("message",mesg,room=mesg['rid'])

@socketio.on('roomId')
def joinRoom(msg):
    join_room(msg) 

def random_filename():
    out=""
    arr=[[ord('a'),ord('z')],[ord('A'),ord('Z')],[ord('0'),ord('9')]]
    for i in range(0,20):
        choice=random.randint(0,2)
        out=out+chr(random.randint(arr[choice][0],arr[choice][1]));      
    return out

def checkLogin():
	if session.get('username'):
		return True
	return False

@app.route("/index")
def index():
	if checkLogin()==True:
		return redirect('/app')
	return redirect("/login")

@app.route("/")
def home():
	if checkLogin()==True:
		return redirect('/app')
	return redirect("/login")

@app.route("/login")
def login():
	if checkLogin()==True:
		return redirect('/app')
	return render_template("login.html")

@app.route("/register")
def register():
	if checkLogin()==True:
		return redirect('/app')
	return render_template("register.html")

@app.route("/validate",methods=['POST'])
def validate():
	username=request.form['username']
	email=request.form['email']
	password=request.form['password']
	fullname=request.form['fullname']
	query = {
    "$or": [
        {"username": username},
        {"email": email}
   	 ]
	}
	check_user=users.find_one(query)
	if check_user:
		return jsonify({'message':"User already exists"});
	else:
		result=users.insert_one({'username':username,'fullname':fullname,'email':email,'password':password,'dp':'default.jpg','bio':'Hey There, I am new here'})
		if result.inserted_id:
			return jsonify({'message': 'User created successfully'})
		else:
			return jsonify({'message': 'Failed to create user'})

@app.route("/validatelogin",methods=['POST'])
def validatelogin():
	username=request.form['username']
	password=request.form['password']
	check_user=users.find_one({'username':username,'password':password})
	if check_user:
		session['username']=username;
		return jsonify({'message': 'Authentication succesfull'}),200
	else:
		return jsonify({'message': 'Username/Password Incorrect'}),401

@app.route("/app",methods=['POST','GET'])
def message():
	if session.get('username'):
		check_user=users.find_one({'username':session.get('username')})
		data={}
		data['username']=session.get('username')
		data['fullname']=check_user['fullname']
		data['dp']=check_user['dp']
		return render_template('app.html',data=data);
	else:
		return redirect('/login')

@app.route("/editprofile",methods=['POST','GET'])
def editprofile():
	if session.get('username'):
		data={}
		data['username']=session.get('username')
		result=users.find_one({'username':session['username']});
		data['bio']=result['bio']
		data['dp']='static/files/'+result['dp']
		return render_template("editprofile.html",data=data)
	else:
		return redirect('/login')

@app.route("/updateprofile",methods=['POST'])
def updateprofile():
	username=request.form['username']
	bio=request.form['bio']
	file=request.files['dp']
	if file.filename!='':
		fname=random_filename()
		file.save(f"static/files/{fname}")
		result = users.update_one({'username': username},{'$set': {'bio': bio,'dp':fname}})
	else:
		result = users.update_one({'username': username},{'$set': {'bio': bio}})
	data={}
	data['username']=session.get('username')
	result=users.find_one({'username':session['username']});
	data['bio']=result['bio']
	data['dp']='static/files/'+result['dp']
	return redirect("/editprofile")

@app.route("/searchusers",methods=['POST'])
def searchprofile():
	data=request.json
	result=users.find_one({'username':data['rid']})
	if result:
		print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
		return jsonify({'resp':"User found"});
	else:
		return jsonify({'resp':"User not found"});

@app.route("/searchuser",methods=['POST'])
def searchuser():
	data1=request.json
	result=users.find_one({'username':data1['rid']})
	if result:
		data=dict();
		data['username']=data1['rid'];
		data['fullname']=result['fullname']
		data['bio']=result['bio']
		data['dp']=result['dp']
		return jsonify(data),200;
	else:
		return jsonify({'resp':"User not found"}),401;


@app.route("/fetchmessages/",methods=['POST','GET'])
def fetchmessages():
	if not session.get('username'):
		return redirect('/login');
	username=session.get('username')
	pipeline = [
        {
            '$match': 
            {
                '$or': [
                    {'sender': username},
                    {'receiver': username}
                ]
            }
        },
        {
            '$group': 
            {
                '_id': {
                    '$cond': [
                        {'$eq': ['$sender', username]},
                        '$receiver',
                        '$sender'
                    ]
                },

                'lastMessage': {'$last': '$content'},
                'unreadCount': {
                    '$sum': {
                        '$cond': 
                        [
                        {'$and':[{'$eq': ['$status', 'unread']},{'$ne': ['$sender', username]}]},
                         1, 
                        0
                        ]
                    }
                },
                'latestTime': {'$max': '$time'},

            }
        },
    ]

	result = list(chats.aggregate(pipeline))
	for r in range(0,len(result)):
		pid=result[r]['_id']
		values=users.find_one({'username':pid});
		result[r]['bio']=values['bio']
		result[r]['dp']=values['dp']
		result[r]['fullname']=values['fullname']
		result[r]['lastMessage_datetime']=result[r]['latestTime'].strftime("%d %B %H:%M")
		result[r]['chattype']="user"
	return jsonify(result),200

@app.route("/fetchforone",methods=['POST','GET'])
def fetchforone():
	if not session.get('username'):
		return redirect('/login');
	data=request.get_json()
	sid=data['sid']
	rid=data['rid'];
	pipeline = [
        {
            "$match": {
                "$or": [
                    {"sender": sid, "receiver": rid},
                    {"sender": rid, "receiver": sid}
                ]
            }
        },
        {
            "$sort": {"time": -1}
        },
        {
            "$limit": 1
        }
    ]
	latest_message = list(chats.aggregate(pipeline))
	print(latest_message)
	unread_count = chats.count_documents(
        { 
            "sender": rid,
            "receiver": sid,
            "status": { "$ne": "read" }
        }
    )
	profiledata=users.find_one({'username':rid});
	final_output={}
	final_output['_id']=rid
	final_output['dp']=profiledata['dp']
	final_output['bio']=profiledata['bio']
	final_output['fullname']=profiledata['fullname']
	final_output['lastMessage']=latest_message[0]['content']
	final_output['lastMessage_datetime']=latest_message[0]['time'].strftime("%d %B %H:%M")
	final_output['unreadCount']=unread_count
	return jsonify(final_output);

@app.route("/getmessages",methods=['POST','GET'])
def getmessages():
	if not session.get('username'):
		return redirect('/login');
	username=session.get('username')
	data=request.get_json()
	rid=data['rid']
	query = {
        "$or": [
            {"sender": username, "receiver": rid},
            {"sender": rid, "receiver": username},
        ]
    }
	output=chats.find(query);
	output=list(output)
	for i in range(0,len(output)):		
		if(output[i]['status']=='unread' and output[i]['receiver']==username ):
			chats.update_one({"_id":output[i]['_id']}, {"$set": {'status':'read'}})
		output[i]['_id']=str(output[i]['_id']);
		if(output[i]['sender']==username):
			output[i]['sent']='yes'
		else:
			output[i]['sent']='no'
		output[i]['datetime']=(output[i]['time']).strftime("%d %B %H:%M")
	return jsonify(output);


@app.route("/sendread",methods=['POST','GET'])
def sendread():
	if not session.get('username'):
		return redirect('/login');
	data=request.get_json()
	sid=data['sid']
	rid=data['rid']
	query ={"sender": sid, "receiver":rid,'status':'unread'}
	output=chats.update_many(query,{'$set':{'status':'read'}});
	return jsonify({'message':'okay'});

@app.route("/logout",methods=['POST','GET'])
def logout():
	session['username']=None
	return redirect('/login')

socketio.run(app, debug=True)