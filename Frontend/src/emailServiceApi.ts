import axios from 'axios';

const emailApi = axios.create({
  baseURL: import.meta.env.VITE_EMAIL_API_URL || 'https://gm1-lovat.vercel.app/',
});

export default emailApi;
