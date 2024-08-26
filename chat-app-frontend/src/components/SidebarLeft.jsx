/* eslint-disable react/prop-types */
import Logo from "./Logo"
import Avatar from "./Avatar"

const SidebarLeft = ({loggedInUsername, contactsToShow, setSelectedUsername, selectedUsername, logout}) => {
  return (
    <div className="bg-white bg-opacity-90 w-full md:w-1/3 flex flex-col h-screen shadow-xl rounded-r-2xl">
      <div className="p-4 border-b border-gray-200">
        <Logo />
      </div>

      <div className="flex-grow overflow-y-auto px-2">
        {contactsToShow.map(contact => (
          <div
            key={contact.username}
            onClick={() => setSelectedUsername(contact.username)}
            className={`flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-colors ${
              contact.username === selectedUsername 
                ? "bg-indigo-100" 
                : "hover:bg-gray-100"
            }`}
          >
            <Avatar username={contact.username} online={contact.online} />
            <span className="font-medium text-sm md:text-base text-gray-800">{contact.username}</span>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-sm text-gray-600">
            Welcome, <span className="font-semibold">{loggedInUsername}</span>
          </span>
          <button
            onClick={logout}
            className="w-full md:w-auto bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
//contants to show contains a username and a online field in array of obbjects

export default SidebarLeft