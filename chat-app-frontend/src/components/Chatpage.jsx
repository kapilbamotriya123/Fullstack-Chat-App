import { useContext, useEffect, useRef, useState } from "react"
import { UserContext } from "../userContext"

import SidebarLeft from "./SidebarLeft"
import MessageForm from "./MessageForm"
import axios from "axios"


// Function to get unique messages
const getUniqueMessages = (messages) => {
    const uniqueMessages = [];
    const messageSet = new Set();

    messages.forEach((message) => {
        const uniqueKey = message.messageId ? message.messageId : `${message.sender}-${message.text}`;
        if (!messageSet.has(uniqueKey)) {
            messageSet.add(uniqueKey);
            uniqueMessages.push(message);
        }
    });

    return uniqueMessages;
};

const ChatPage = () => {
    const [ws, setWs] = useState(null)
    const [onlinePeople, setOnlinePeople] = useState([])
    const [selectedUsername, setSelectedUsername] = useState(null)
    const [newMessageText, setNewMessageText] = useState('')
    const [messages, setMessages] = useState([])
    const [contactsToShow, setContactsToShow] = useState([]);
    const divUnderMessages = useRef()

    
    const { loggedInUsername, id, setLoggedInUsername,setId} = useContext(UserContext);

    useEffect(() => {
        axios.get(`/messages/${selectedUsername}`).then(res => {
            const { data } = res;
            setMessages(getUniqueMessages(data));
        });
    }, [selectedUsername]);

    const connectToWs = () => {
        const ws = new WebSocket('ws://localhost:3003');
        setWs(ws);
        ws.addEventListener('message', handleMessage);
        ws.addEventListener('close', () => {
            setTimeout(() => {
                connectToWs();
            }, 1000);
        });
    }

    useEffect(() => {
        connectToWs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    
    const showOnlinePeople = (peopleArray) => {
        const uniqueUsernames = [];
        peopleArray.forEach((person) => {
            if (!uniqueUsernames.includes(person.username)) {
                uniqueUsernames.push(person.username);
            }
        });
        setOnlinePeople(uniqueUsernames);
    };

    useEffect( () => {
        axios.get('/people').then(people => {
            const allPeopleArr = people.data.filter(p => p._id !== id);
            const contToShow = allPeopleArr.map(person => {
               const username = person.username
               const online = onlinePeople.includes(person.username) ? true : false;
               return ({
                username, online
               })
            })
            setContactsToShow(contToShow)            

        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    } , [onlinePeople])

    
    //here I need to changes so that contacts to show shows all people as an array of object with username and boolean online 
    // const contactsToShow = offlinePeople.map



    const sendMessage = (event) => {
        event.preventDefault();
        ws.send(JSON.stringify({
            sender: id,
            recipient: selectedUsername,
            text: newMessageText
        }));
        setMessages(getUniqueMessages([...messages, { text: newMessageText, isOur: true, recipient: selectedUsername, sender: loggedInUsername }]));
        setNewMessageText('');
    };

    useEffect(() => {
        const div = divUnderMessages.current;
        if (div && messages.length > 0) {
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages]);

    const handleMessage = (event) => {
        const messageData = JSON.parse(event.data);

        if ('online' in messageData) {
            showOnlinePeople(messageData.online);
        } else if ('text' in messageData) {
            setMessages(prev => getUniqueMessages([...prev, { ...messageData }]));
        }
    };

    const logout = () => {
        if(window.confirm("Do you wish to terminate your current session?")) {
            axios.post('/logout').then( () => {
                setLoggedInUsername(null);
                setId(null);
            })
        }
    }

    return (
      <div className="flex h-screen bg-gradient-to-r from-blue-400 to-purple-500">
        <SidebarLeft
          loggedInUsername={loggedInUsername}
          contactsToShow={contactsToShow}
          setSelectedUsername={setSelectedUsername}
          selectedUsername={selectedUsername}
          logout={logout}
        />
        <div className="bg-white bg-opacity-90 w-full md:w-2/3 p-4 flex flex-col rounded-l-2xl shadow-xl">
          <div className="flex-grow pb-4">
            {!selectedUsername && (
              <div className="flex items-center h-full justify-center">
                <div className="text-gray-500 text-lg">&larr; Select a contact to start chatting</div>
              </div>
            )}
           {selectedUsername && (
  <div className="relative h-full">
    <div className="overflow-y-auto absolute inset-0 px-4">
      {messages.length > 0 ? (
        messages.map(message => (
          <div 
            key={message.id || `${message.sender}-${message.text}`} 
            className={`flex ${message.sender === loggedInUsername ? "justify-end" : "justify-start"} mb-3`}
          >
            <div className={`max-w-[70%] md:max-w-[60%] p-3 rounded-lg text-sm ${
              message.sender === loggedInUsername 
                ? "bg-indigo-600 text-white rounded-br-none" 
                : "bg-gray-200 text-gray-800 rounded-bl-none"
            }`}>
              {message.text}
            </div>
          </div>
        ))
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 text-lg">
            Type a message to start chatting with {selectedUsername}
          </div>
        </div>
      )}
      <div ref={divUnderMessages}></div>
    </div>
  </div>
)}
          </div>
    
          {selectedUsername && (
            <MessageForm
              sendMessage={sendMessage}
              newMessageText={newMessageText}
              setNewMessageText={setNewMessageText}
            />
          )}
        </div>
      </div>
    );
}

export default ChatPage;
