const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const User = require('./models/User')
const Message = require('./models/Message')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const bcrypt = require('bcrypt')
const ws = require('ws')
dotenv.config()


const app = express()
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}))

app.use(express.static('dist'))
app.use(express.json())
app.use(cookieParser())
 
const mongourl = process.env.MONGODB_URI
const jwtSecret = process.env.SECRET
 


mongoose.connect(mongourl, {
  serverSelectionTimeoutMS: 1000, // Defaults to 30000 (30 seconds)
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));



const getUserFromReq = (req) => {
    const token = req.cookies?.token
    if (token) {
        try {
            const userData = jwt.verify(token, jwtSecret)
            return userData
        } catch (error) {
            throw error
        }
    } 
}

app.get('/test', async (req, res) => {
    try {
      await User.deleteMany({});
      res.send('Database cleared!');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error clearing database');
    }
  });

app.get('/profile', async(req, res) => {
    const userData = getUserFromReq(req)
    if (userData) {
        try {
            res.json(userData)
        } catch (error) {
            throw error
        }
    } else {
        res.status(403).json('no token')
    }
})

app.get('/people', async(req, res) => {
    const users = await User.find({}, {'_id':1, username:1})
    res.json(users);
    
})


app.post('/register', async(req, res) => {
    const { username, password } = req.body;
    let forToken = null;
    
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
    try {
      const createdUser = await User.create({ username, passwordHash });
      forToken = {
        userId: createdUser._id,
        username: createdUser.username,
    };
        const generatedToken = await jwt.sign(forToken, jwtSecret);
        res.cookie('token', generatedToken, {sameSite:'none', secure:true}).status(201).json({
            id: createdUser._id,
            username: createdUser.username
        })
    } catch (error) {
      if (error.code === 11000) { // 11000 is the error code for duplicate key in MongoDB
        return res.status(400).json({ message: 'Username already exists' });
      }
      throw error; // If it's not a duplicate username error, re-throw the error
    }
})

app.post('/login', async(req, res) => {
    const {username, password} = req.body
    try {
    const user = await User.findOne({username:username})
    if(!user) {
        return res.status(404).json({error: 'username not found'})
    }

    const correctPassword = await bcrypt.compare( password, user.passwordHash)
    if(!correctPassword) {
        return res.status(401).json({error: "wrong password"})
    }
    
    forToken = {
        userId: user._id,
        username: user.username,
    };
        const generatedToken = await jwt.sign(forToken, jwtSecret);
        res.cookie('token', generatedToken, {sameSite:'none', secure:true}).status(201).json({
            id: user._id,
            username: user.username
        })
    } catch (error) {
      if (error.code === 11000) { // 11000 is the error code for duplicate key in MongoDB
        return res.status(400).json({ message: 'Username already exists' });
      }
      
    }
})

app.post('/logout', async (req, res) => {
    res.cookie('token', '', {sameSite:'none', secure: 'true'}).json('ok')
})

app.get('/messages/:username', async(req, res) => {

    const {username} = req.params
    const user = await User.findOne({username})
    if (user) {
        const userId = user._id.toString()
        const ourUserData = await getUserFromReq(req)
        const ourUserId = ourUserData.userId
        const messages = await Message.find({
            sender: {$in: [userId, ourUserId]},
            recipient: {$in:[userId, ourUserId]}
        }).sort({createdAt: 1})
        let response = []
        messages.forEach(message => {
            const {text, _id, sender, recipient} = message 

            response = response.concat({
                text: text,
                sender: sender.toString() === ourUserId ? ourUserData.username : username,
                recipient: recipient.toString() === ourUserId ? ourUserData.username : username

            })
        });
        res.json(response)
    }
})
const server = app.listen(3003, ()=> {
    console.log(`app running on port 3003`);
})

const wss = new ws.WebSocketServer({server})

wss.on('connection', async (connection, req) => {

    const notifyAboutOnlinePeople = () => {
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))
            }));
        });
    }

    connection.isAlive = true;

    connection.timer = setInterval( () => {
        connection.ping();
        connection.deathTimer = setTimeout( () => {
            connection.isAlive =false;
            connection.terminate();
            notifyAboutOnlinePeople();
            
        }, 1000);
    }, 5000);

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    });
    






  // we are reading username and id from the cookie for this connection
  const cookies = req.headers.cookie;
  if (cookies) {
      const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
      //extracting the user information from cookie and storing it to connection
      if (tokenCookieString) {
          const token = tokenCookieString.split('=')[1];
          if (token) {
              try {
                  const { username, userId } = await jwt.verify(token, jwtSecret);
                  connection.userId = userId;
                  connection.username = username;
                } catch (error) {
                    throw error;
                }
            }
        }
    }
    
    // when someone sends a message
    connection.on('message', async (message) => {
        try {
            const messageData = JSON.parse(message.toString());
            const {recipient, text, sender} = messageData
            // console.log(messageData)
            if(recipient && text) {
                //this is for finding the user id of the recipient as the data only has username in it this is a extra processing due to some shit that we created in the past
                let user = await User.find({})
                user = user.find(user => user.username === recipient);
                const recipientUserId = user._id.toString()
                const messageDoc = await Message.create({
                        sender: connection.userId,
                        recipient: recipientUserId,
                        text
            });
            //console.log(messageDoc);
            [...wss.clients]
            .filter(client => client.username === recipient)
            .forEach(client => 
                client.send(JSON.stringify({
                text,
                sender: connection.username,
                messageId:messageDoc._id,
                recipient

            })));
            /* this is important as we are not finding , we are filtering which at first glance might look off as there
            is only one user of username but clients are user so a single user can be
            connected on multiple devices so there may be multiple clients and we want to send data to everyone of them */
          }

      } catch (error) {
          console.error('Error parsing message:', error);
      }
  });
  // notify the people about who is online
  notifyAboutOnlinePeople()
});

wss.on( 'close', data => {
    console.log('disconnect', data)
});
