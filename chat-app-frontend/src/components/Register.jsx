import { useContext, useState } from "react";
import userService from '../services/userService.js';
import { UserContext } from "../userContext.jsx";
import ChatPage from "./Chatpage.jsx";

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('register');
    const [notification, setNotification] = useState(null);
    const { loggedInUsername, setLoggedInUsername, setId } = useContext(UserContext);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setNotification(null);

        try {
            const service = isLoginOrRegister === 'register' ? userService.register : userService.login;
            const data = await service({ username, password });

            if (data.success) {
                setLoggedInUsername(data.data.username);
                setId(data.data.id);
            } else {
                setNotification({ type: 'error', message: data.error });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
        }
    };

    if (loggedInUsername) {
        return <ChatPage />;
    }

    return (
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-6 rounded-xl shadow-md">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isLoginOrRegister === 'register' ? 'Create your account' : 'Sign in to your account'}
                    </h2>
                </div>
                {notification && (
                    <div className={`p-2 rounded-md ${notification.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {notification.message}
                    </div>
                )}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                value={username}
                                onChange={({ target }) => setUsername(target.value)}
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Username"
                            />
                        </div>
                        <div>
                            <input
                                value={password}
                                onChange={({ target }) => setPassword(target.value)}
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {isLoginOrRegister === 'register' ? "Register" : "Sign in"}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    {isLoginOrRegister === "register" ? (
                        <p className="text-sm">
                            Already have an account?{' '}
                            <button
                                onClick={() => setIsLoginOrRegister("login")}
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Sign in
                            </button>
                        </p>
                    ) : (
                        <p className="text-sm">
                            Don't have an account?{' '}
                            <button
                                onClick={() => setIsLoginOrRegister('register')}
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Register
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;