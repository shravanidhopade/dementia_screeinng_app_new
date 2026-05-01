import axios from 'axios';
import { getData, saveData } from './storage';

// Use the machine's local IP address so physical phones can connect to the backend
// const API_URL = 'http://192.168.1.211:8000'; 

const API_URL = 'https://dementia-api-vjr7.onrender.com';

// Register a new user
export const registerUser = async (userData) => {
  try {
    console.log('📝 Attempting registration to:', `${API_URL}/register`);
    console.log('📤 Sending user data:', { ...userData, password: '***' });
    
    const response = await axios.post(`${API_URL}/register`, userData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ Registration successful:', response.status);
    return response.data;
  } catch (error) {
    console.error('❌ Registration Error - Status:', error.response?.status);
    console.error('❌ Registration Error - Data:', error.response?.data);
    console.error('❌ Registration Error - Message:', error.message);
    console.error('❌ Registration Error - Code:', error.code);
    throw error;
  }
};

// Login user and save token
export const loginUser = async (username, password) => {
  try {
    // Fast API OAuth2 expects x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    console.log('🔐 Attempting login to:', `${API_URL}/login`);
    console.log('📤 Sending params:', { username, password: '***' });

    const response = await axios.post(`${API_URL}/login`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ Login successful:', response.status);
    if (response.data.access_token) {
      await saveData('@auth_token', response.data.access_token);
    }
    return response.data;
  } catch (error) {
    console.error('❌ Login Error - Status:', error.response?.status);
    console.error('❌ Login Error - Data:', error.response?.data);
    console.error('❌ Login Error - Message:', error.message);
    console.error('❌ Login Error - Code:', error.code);
    throw error;
  }
};

// Predict risk and sync with backend if logged in
export const predictRisk = async (features) => {
  try {
    const token = await getData('@auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.post(`${API_URL}/predict`, features, { headers });
    return response.data;
  } catch (error) {
    console.error('API Error predicting risk:', error);
    return {
      predicted_risk_level: "Unknown (Offline)",
      recommendation_message: "Error connecting to server. Results might not be saved."
    };
  }
};

// Get history from backend
export const fetchHistory = async () => {
  try {
    const token = await getData('@auth_token');
    if (!token) return null;
    
    const response = await axios.get(`${API_URL}/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching history:', error);
    return null;
  }
};
// Analyze voice recording for a given task
export const analyzeVoice = async (audioUri, taskId) => {
  try {
    const token = await getData('@auth_token');
    const lang = await getData('@language') || 'en';
    const headers = {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    });
    formData.append('lang', lang);

    const response = await axios.post(`${API_URL}/analyze-voice/${taskId}`, formData, { headers });
    return response.data;
  } catch (error) {
    console.error(`Voice analysis error (task ${taskId}):`, error.response?.data || error.message);
    return null;
  }
};
