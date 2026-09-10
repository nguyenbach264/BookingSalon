import axios from "axios";

const API_URL = "http://localhost:8080/api/notifications"; 

export const notificationApi = async (data) => {
  const response = await axios.post(
    API_URL, 
    data, 
    {
      withCredentials: true
    }
  ); 

  return response.data; 
}; 