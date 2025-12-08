import axios from 'axios';

const emailApi = axios.create({
  baseURL: import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:5001',
});

export default emailApi;
