import io from 'socket.io-client';
import SQLite from 'react-native-sqlite-storage';

const BASE_URL = "http://10.0.2.2:5000/";

export const socket = io(BASE_URL, {
    transports: ['websocket'],
    autoConnect: true,
});

export const syncWithCloud = async (endpoint: string, payload: any) => {
    try {
        const response = await fetch(`${BASE_URL}/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.error || "Server rejected request" };
        }
    } catch (error) {
        console.error("Network Error:", error);
        return { success: false, error: "Cannot reach server. Check IP 10.0.2.2" };
    }
};

export const db = SQLite.openDatabase(
  { name: 'library.sqlite', location: 'default' },
  () => console.log('Database connected'),
  (error) => console.error('Database connection error', error)
);