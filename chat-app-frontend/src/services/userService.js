import axios from "axios";

const handleError = (error) => {
  if (error.response) {
    return error.response.data.error || error.response.data.message || "An error occurred";
  } else if (error.request) {
    return "No response from server. Please try again.";
  } else {
    return "An unexpected error occurred. Please try again.";
  }
};

const register = async (credentials) => {
  try {
    const response = await axios.post(`/register`, credentials);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleError(error) };
  }
};

const login = async (credentials) => {
  try {
    const response = await axios.post('/login', credentials);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleError(error) };
  }
};

export default { register, login };