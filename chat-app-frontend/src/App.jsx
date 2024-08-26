import axios from 'axios'
import { UserContextProvider } from './userContext'
import Register from './components/Register'
import './components/styles.css'

const App=() => {
axios.defaults.baseURL = ''
axios.defaults.withCredentials = true

  return (
    <UserContextProvider>
      <Register />
    </UserContextProvider>
  )
}

export default App