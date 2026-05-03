import { io } from "socket.io-client";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { db } from './database'; 

// 1. Define the BASE_URL correctly for the Android Emulator
const BASE_URL = "http://10.0.2.2:5000"; 
const SOCKET_URL = `${BASE_URL}/digital-library-app`;

export let socket;

// ------------------- CONNECTION MANAGEMENT -------------------

export const connect = () => {
    // ONLY create if socket doesn't exist OR is completely disconnected
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ["websocket"],
            forceNew: false, // Change to false to reuse connections
            reconnection: true
        });
        console.log("Initializing Socket...");
    } else if (!socket.connected) {
        socket.connect();
        console.log("Reconnecting Socket...");
    }
}
// ------------------- HTTP CRUD SERVICES (Cloud) -------------------

//---------------------HTTP CRUD: Students Table---------------------
/**
 * READ: Fetch all students via HTTP GET (CO4 Requirement)
 */
export const fetchStudents = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/students`);
        if (!response.ok) throw new Error("Failed to fetch students");
        return await response.json();
    } catch (error) {
        console.error("HTTP GET Error:", error);
        return [];
    }
};

/**
 * CREATE: Post new student to Cloud
 */
export const createStudentHTTP = async (studentData) => {
    try {
        const response = await fetch(`${BASE_URL}/api/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        const result = await response.json();
        
        if (response.ok) {
            // Broadcast via WebSocket so other admins see the update instantly
            if (socket && socket.connected) {
                socket.emit("send_message", { message: `New student joined: ${studentData.username}` });
            }
        }
        return result;
    } catch (error) {
        console.error("Create Student Error:", error);
    }
};

/**
 * DELETE: Remove a student from the cloud database
 */
export const deleteStudentHTTP = async (studentId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/students/${studentId}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (error) {
        console.error("Delete Student Error:", error);
    }
};

// ------------------- HTTP CRUD: BOOKS TABLE -------------------
export const fetchEachStudentsBooks = async (studentId = 0) => {
    try {
        const idToQuery = Number(studentId) || 0;
        const response = await fetch(`${BASE_URL}/api/books?studentId=${idToQuery}`); 
        if (!response.ok) throw new Error("Cloud fetch failed");
        
        const data = await response.json();
        return data; 
    } catch (error) {
        console.error("Books Fetch Error:", error);
        return [];
    }
};

export const fetchAllBooksWS = (studentId = 0) => {
    if (socket && socket.connected) {
        socket.emit("get_books", { studentId: Number(studentId) });
    }
};

/**
 * CREATE: Add a new book (Admin Functionality)
 */
export const addBookHTTP = async (bookData) => {
    try {
        const response = await fetch(`${BASE_URL}/api/books/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });
        return await response.json();
    } catch (error) {
        console.error("Add Book Error:", error);
    }
};

/**
 * DELETE: Remove a book from the cloud
 */
export const deleteBookHTTP = async (bookId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/books/${bookId}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (error) {
        console.error("Delete Book Error:", error);
    }
};

//------------------------------Loans Table------------------------------
export const borrowBookHTTP = async (studentId, bookId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/books/borrow/${bookId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId })
        });
        return await response.json();
    } catch (error) {
        console.error("Borrow Error:", error);
    }
};

//-----------------------------Wishlist Table-----------------------
export const fetchLocalWishlist = async () => {
    const studentId = await AsyncStorage.getItem('currentUserId');
    if (!studentId) return;

    db.transaction((tx) => {
        tx.executeSql(
            'SELECT cloud_id FROM wishlist WHERE student_id = ?',
            [studentId],
            (_, results) => {
                let ids = [];
                for (let i = 0; i < results.rows.length; i++) {
                    ids.push(results.rows.item(i).cloud_id.toString());
                }
            }
        );
    });
};

export const toggleWishlist = async (studentId, bookId, action) => {
    try {
        const response = await fetch(`${BASE_URL}/api/wishlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, bookId, action })
        });
        return await response.json();
    } catch (error) {
        console.error("Wishlist Error:", error);
    }
};

export const notifyBookBorrowed = (bookTitle) => {
    if (socket && socket.connected) {
        socket.emit("send_message", { 
            message: `Someone just borrowed "${bookTitle}"!` 
        });
        console.log("WebSocket Notification Sent");
    }
};

// ------------------- HOME SCREEN SERVICES -------------------

export const fetchBooksForHome = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/books`); 
        if (!response.ok) throw new Error("Failed to load library catalog");
        return await response.json();
    } catch (error) {
        console.error("Home Screen Fetch Error:", error);
        return [];
    }
};

//--------------------Update Username & Password ----------------
export const updateUsernameCloud = async (studentId, newUsername) => {
    try {
        const response = await fetch(`${BASE_URL}/api/students/${studentId}/username`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: newUsername }),
        });

        // Check if the response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } else {
            // Handle HTML errors 
            const errorText = await response.text();
            console.error("Server Error (HTML received):", errorText);
            return { success: false, error: "Invalid server response. Check backend routes." };
        }
    } catch (error) {
        console.error("Network Error:", error);
        throw error;
    }
};

export const updatePasswordCloud = async (studentId, newPassword) => {
    try {
        const response = await fetch(`${BASE_URL}/api/students/${studentId}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword }),
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        }
        return { success: false, error: "Server returned non-JSON response." };
    } catch (error) {
        throw error;
    }
};
// ------------------- WEBSOCKET SERVICES (Real-time) -------------------

export const requestBookDelete = (id) => {
    if (socket && socket.connected) {
        console.log("📡 Emitting delete_book for ID:", id);
        
        // Force the ID to a Number to prevent SQL errors on the server
        socket.emit('delete_book', { id: Number(id) }); 
    } else {
        // Fallback in case the WebSocket is down
        Alert.alert("Connection Error", "Not connected to the cloud server. Please try again.");
    }
};

export const requestStudentCreate = (studentData) => {
    if (socket && socket.connected) {
        socket.emit("create_student", studentData);
    }
};

export const requestStudentList = () => {
    if (socket && socket.connected) socket.emit("get_students");
};


export const requestStudentDelete = (id) => {
    if (socket && socket.connected) socket.emit("delete_student", { id });
};


export const requestBooks = (studentId = 0) => {
    socket.emit("get_books", { studentId });
};

export const borrowBook = (studentId, bookId) => {
    socket.emit("borrow_book", { studentId, bookId });
};

export const setupSocketListeners = (callbacks) => {
    socket.on("connect", () => {
        console.log("WebSocket Connected");
        socket.emit("client_connected", { connected: true });
    });

    socket.on('student_created', (result) => {
        if (callbacks.onStudentCreated) callbacks.onStudentCreated(result);
    }); 

    //Admin add student
    socket.on("student_create_result", (result) => {
        if (result.success) {
            // Popup for successful addition
            Alert.alert("Success", "Student has been added to the cloud database successfully."); 
            if (callbacks.onStudentCreated) callbacks.onStudentCreated(result);
        } else {
            // Popup for unsuccessful addition
            Alert.alert("Error", result.error || "Failed to add student. Please try again."); 
        }
    });

    socket.on("student_update", (data) => {
        if (callbacks.onStudentUpdate) callbacks.onStudentUpdate(data);
    });

    socket.on("receive_books", (books) => {
        if (callbacks.onBooksReceived) callbacks.onBooksReceived(books);
    });

    socket.on("borrow_result", (result) => {
        if (callbacks.onBorrowResult) callbacks.onBorrowResult(result);
    });

    socket.on("notification", (data) => {
        if (callbacks.onNotification) callbacks.onNotification(data);
    });

    socket.on("connect_error", (err) => {
        console.error("Socket Error:", err.message);
    });
};

export const disconnect = () => {
    if (socket && socket.connected) {
        socket.disconnect();
    }
};