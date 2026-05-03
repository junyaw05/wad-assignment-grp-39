const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const DB_PATH = 'library.sqlite';
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(cors());
app.use(express.json());

const libraryNamespace = io.of('/digital-library-app');

libraryNamespace.on('connection', (socket) => {
    socket.on('get_books', (data) => {
        const studentId = data.studentId || 0;
        const query = `
            SELECT books.*, 
            (SELECT COUNT(*) FROM loans WHERE loans.book_id = books.id) as total_borrows,
            IFNULL((SELECT 1 FROM loans WHERE loans.book_id = books.id AND loans.student_id = ? LIMIT 1), 0) as is_my_loan,
            /* FETCH THE ACTUAL TIMESTAMP HERE */
            (SELECT borrowed_time FROM loans WHERE loans.book_id = books.id AND loans.student_id = ? LIMIT 1) as borrowed_time
            FROM books ORDER BY id ASC`;
        
        db.all(query, [studentId, studentId], (err, rows) => {
            if (!err) socket.emit('receive_books', rows);
        });
    });

    //create student
    socket.on('create_student', (data) => {
        const { username, email, password } = data;
        db.run(`INSERT INTO students (username, email, password) VALUES (?, ?, ?)`, 
        [username, email, password], function (err) {
            if (err) {
                return socket.emit('student_create_result', { 
                    success: false, 
                    error: err.message.includes("UNIQUE") ? "Email already exists" : err.message 
                });
            }
            socket.emit('student_create_result', { success: true, id: this.lastID });
            libraryNamespace.emit('student_update', { action: 'registered', username });
        });
    });

    //delete student
    socket.on('delete_student', (data) => {
        db.run(`DELETE FROM students WHERE id = ?`, [data.id], function (err) {
            if (!err) libraryNamespace.emit('student_update', { action: 'deleted', id: data.id });
        });
    });

    //fetch all students
    socket.on('get_students', () => {
        const query = `SELECT id, username, email FROM students ORDER BY id ASC`;

        db.all(query, [], (err, rows) => {
            if (err) {
                console.error("Error fetching students:", err.message);
                return socket.emit('error_notification', { message: "Failed to load student list." });
            }

            socket.emit('receive_students', rows);
            console.log(`Sent ${rows.length} students to client: ${socket.id}`);
        });
    });

    socket.on('add_book', (data) => {
        const { title, author, description, genre, book_cover, pdf_url } = data;
        const query = `INSERT INTO books (title, author, description, genre, book_cover, pdf_url) VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.run(query, [title, author, description, genre, book_cover, pdf_url], function (err) {
            if (err) {
                return socket.emit('book_action_result', { success: false, error: err.message });
            }
            socket.emit('book_action_result', { success: true, action: 'added' });
            libraryNamespace.emit('library_update', { action: 'added', title });
        });
    });

    // Delete books via WebSocket
    socket.on('delete_book', (data) => {
        const { id } = data;
        db.run(`DELETE FROM books WHERE id = ?`, [id], function (err) {
            if (err) {
                return socket.emit('book_action_result', { success: false, error: err.message });
            }
            socket.emit('book_action_result', { success: true, action: 'deleted' });
            libraryNamespace.emit('library_update', { action: 'deleted', bookId: id });
        });
    });
});

//Database Connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error("Database connection failed:", err.message);
    else {
        console.log("Connected to library.sqlite");
        db.run("PRAGMA foreign_keys = ON");
    }
});

    // students table
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            email TEXT UNIQUE,
            password TEXT
        )`);

    //books table
    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        author TEXT,
        description TEXT,
        book_cover TEXT,
        pdf_url TEXT,
        borrowed_time DATETIME,
        genre TEXT
    )`);

    //loans table
    db.run(`CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        book_id INTEGER,
        borrowed_time DATETIME,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (book_id) REFERENCES books(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS wishlist (
        student_id INTEGER,
        book_id INTEGER,
        PRIMARY KEY (student_id, book_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS loan_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    book_id INTEGER,
    borrowed_at DATETIME,
    returned_at DATETIME,
    status TEXT -- 'returned' or 'active'
    )`);
});


// ------------------- Students API ------------------
// GET all students
app.get('/api/students', (req, res) => {
  db.all('SELECT id,username,email,password FROM students ORDER BY id', [], (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

app.post('/api/students', (req, res) => {
    const { username, email, password } = req.body;
    const stmt = `INSERT INTO students (username, email, password) VALUES (?, ?, ?)`;
    db.run(stmt, [username, email, password], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
                return res.status(400).json({ error: "Email already registered." });
            }
            return res.status(500).json({ error: err.message });
        }
        libraryNamespace.emit('student_update', { action: 'registered', username });
        res.status(201).json({ id: this.lastID, message: "User created successfully" });
    });
});

app.delete('/api/students/:id', (req, res) => {
    db.run('DELETE FROM students WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        libraryNamespace.emit('student_update', { action: 'deleted', id: req.params.id });
        res.json({ message: "Deleted successfully" });
    });
});

// ------------------- Update Username ------------------
app.put('/api/students/:id/username', (req, res) => {
    const { username } = req.body;
    const studentId = req.params.id;

    if (!username || username.length < 6) {
        return res.status(400).json({ error: "Username must be at least 6 characters." });
    }

    const query = `UPDATE students SET username = ? WHERE id = ?`;
    db.run(query, [username, studentId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        
        if (this.changes === 0) return res.status(404).json({ error: "Student not found." });

        console.log(`Username updated for ID ${studentId} -> ${username}`);

        libraryNamespace.emit('student_update', { action: 'updated', id: studentId, username: username });

        res.json({ success: true, message: "Username updated successfully." });
    });
});

// ------------------- Update Password ------------------
app.put('/api/students/:id/password', (req, res) => {
    const { password } = req.body;
    const studentId = req.params.id;

    // Simple validation
    if (!password || password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const query = `UPDATE students SET password = ? WHERE id = ?`;
    db.run(query, [password, studentId], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        if (this.changes === 0) return res.status(404).json({ error: "Student not found." });

        console.log(`Password updated for ID ${studentId}`);

        libraryNamespace.emit('student_update', { action: 'security_update', id: studentId });

        res.json({ success: true, message: "Password updated successfully." });
    });
});


//--------------------Login------------------------------
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT id, username, email, password FROM students WHERE email = ?`, [email], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row || row.password !== password) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        res.json({ message: "Login successful", user: { id: row.id, username: row.username, email: row.email } });
    });
});



// ------------------- Books API ------------------
app.get('/api/books', (req, res) => {
    const studentId = req.query.studentId || 0; 

    const query = `
        SELECT books.*, 
        (SELECT COUNT(*) FROM loans WHERE loans.book_id = books.id) as total_borrows,
        IFNULL((SELECT 1 FROM loans WHERE loans.book_id = books.id AND loans.student_id = ? LIMIT 1), 0) as is_my_loan,
        /* FETCH THE ACTUAL TIMESTAMP HERE */
        (SELECT borrowed_time FROM loans WHERE loans.book_id = books.id AND loans.student_id = ? LIMIT 1) as borrowed_time
        FROM books
        ORDER BY id ASC
    `;

    db.all(query, [studentId, studentId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/books/add', (req, res) => {
    const { title, author, description, genre, book_cover, pdf_url } = req.body;
    const query = `INSERT INTO books (title, author, description, genre, book_cover, pdf_url) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [title, author, description, genre, book_cover, pdf_url], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Emit to namespace
        libraryNamespace.emit('library_update', { action: 'added', title });
        res.status(201).json({ id: this.lastID });
    });
});

app.put('/api/books/borrow/:id', (req, res) => {
    const bookId = parseInt(req.params.id);
    const studentId = parseInt(req.body.studentId);
    const currentTime = new Date().toISOString();

    //Check current loan count
    const countQuery = `SELECT COUNT(*) as loan_count FROM loans WHERE student_id = ?`;
    db.get(countQuery, [studentId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.loan_count >= 10) {
            return res.status(400).json({ error: "Limit Reached (10 books max)." });
        }

        // Check if already borrowed
        db.get(`SELECT * FROM loans WHERE student_id = ? AND book_id = ?`, [studentId, bookId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (row) return res.status(400).json({ error: "You already have this book!" });

            //Proceed with the Active Loan
            const loanStmt = `INSERT INTO loans (student_id, book_id, borrowed_time) VALUES (?, ?, ?)`;
            db.run(loanStmt, [studentId, bookId, currentTime], function(err) {
                if (err) return res.status(500).json({ error: err.message });

                console.log(`Active Loan: Student ${studentId} -> Book ${bookId}`);

                // Record in History Table
                const historyStmt = `INSERT INTO loan_history (student_id, book_id, borrowed_at, status) VALUES (?, ?, ?, ?)`;
                db.run(historyStmt, [studentId, bookId, currentTime, 'active'], (err) => {
                    if (err) {
                        console.error("History Insert Error:", err.message);
                    }
                    
                    io.emit('library_update', { action: 'borrowed', bookId: bookId });
                    
                    // Send the ONLY response back to the client
                    return res.json({ 
                        success: true, 
                        message: "Borrowed successfully and logged in history.", 
                        time: currentTime 
                    });
                });
            });
        });
    });

});

//------------------LeaderBoard-------------------
app.get('/api/books/leaderboard', (req, res) => {
    const query = `
        SELECT 
            b.id, 
            b.title, 
            b.author, 
            b.description, 
            b.book_cover, 
            b.genre, 
            b.pdf_url,
            COUNT(lh.id) as count
        FROM books b
        LEFT JOIN loan_history lh ON b.id = lh.book_id
        GROUP BY b.id, b.title, b.author, b.description, b.book_cover, b.genre, b.pdf_url
        ORDER BY count DESC, b.title ASC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Leaderboard SQL Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});


// ------------------- Loans API ------------------
app.get('/api/loans/:student_id', (req, res) => {
    const query = `SELECT books.*, loans.borrowed_time FROM loans JOIN books ON loans.book_id = books.id WHERE loans.student_id = ?`;
    db.all(query, [req.params.student_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.delete('/api/loans/:student_id/:book_id', (req, res) => {
    const { student_id, book_id } = req.params;
    const returnTime = new Date().toISOString();

    //Remove from active loans
    db.run(`DELETE FROM loans WHERE student_id = ? AND book_id = ?`, [student_id, book_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Update history table instead of deleting
        db.run(`UPDATE loan_history 
                SET status = 'returned', returned_at = ? 
                WHERE student_id = ? AND book_id = ? AND status = 'active'`, 
                [returnTime, student_id, book_id]);

        libraryNamespace.emit('library_update', { action: 'returned', bookId: book_id });
        res.json({ message: "Returned successfully." });
    });
});

app.get('/api/loans/active-loans-count', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM loans', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ count: row.count });
    });
});

//----------------------------WISHLIST API--------------------------
app.post('/api/wishlist', (req, res) => {
    const { studentId, bookId, action } = req.body;

    if (action === 'add') {
        // Use INSERT OR IGNORE to prevent errors if the student adds the same book twice
        const stmt = `INSERT OR IGNORE INTO wishlist (student_id, book_id) VALUES (?, ?)`;
        db.run(stmt, [studentId, bookId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            console.log(`Book ${bookId} added to student ${studentId} wishlist`);
            res.status(200).json({ success: true, message: "Added to cloud wishlist" });
        });
    } else if (action === 'remove') {
        const stmt = `DELETE FROM wishlist WHERE student_id = ? AND book_id = ?`;
        db.run(stmt, [studentId, bookId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            console.log(`Book ${bookId} removed from student ${studentId} wishlist`);
            res.status(200).json({ success: true, message: "Removed from cloud wishlist" });
        });
    } else {
        res.status(400).json({ error: "Invalid action. Use 'add' or 'remove'." });
    }
});

//-----------------Loans History-----------------------

app.get('/api/admin/loan-history', (req, res) => {
    const query = `
        SELECT 
            lh.id, 
            s.username as student_name, 
            b.title as book_title, 
            lh.borrowed_at, 
            lh.returned_at, 
            lh.status
        FROM loan_history lh
        JOIN students s ON lh.student_id = s.id
        JOIN books b ON lh.book_id = b.id
        ORDER BY lh.borrowed_at DESC`;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


//----------------------Generate Books Data----------------------
const seedBooks = () => {
    const sampleBooks = [
        // --- Computer Science ---
        ['Structure and Interpretation of Computer Programs', 'Harold Abelson', 'A classic textbook on programming paradigms and computer science foundations.', 'https://picsum.photos/seed/cs1/200/300', 'https://web.mit.edu/6.001/6.037/sicp.pdf', 'Computer Science'],
        ['Operating Systems: Three Easy Pieces', 'Remzi Arpaci-Dusseau', 'A clear and modern guide to virtualization, concurrency, and persistence.', 'https://picsum.photos/seed/cs5/200/300', 'https://pages.cs.wisc.edu/~remzi/OSTEP/preface.pdf', 'Computer Science'],

        // --- Fiction & Classics ---
        ['Pride and Prejudice', 'Jane Austen', 'A classic comedy of manners regarding marriage and social standing.', 'https://picsum.photos/seed/fic1/200/300', 'https://www.gutenberg.org/cache/epub/1342/pg1342-images.html', 'Fiction'],
        ['Frankenstein', 'Mary Shelley', 'The haunting tale of a scientist and his monstrous creation.', 'https://picsum.photos/seed/fic7/200/300', 'https://www.gutenberg.org/cache/epub/84/pg84-images.html', 'Fiction'],
        ['Alice in Wonderland', 'Lewis Carroll', 'A surreal journey through a rabbit hole into a world of nonsense.', 'https://picsum.photos/seed/fic3/200/300', 'https://www.gutenberg.org/cache/epub/11/pg11-images.html', 'Fiction'],
        ['Moby Dick', 'Herman Melville', 'An epic tale of obsession and the sea.', 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1000&auto=format&fit=crop', 'https://www.gutenberg.org/cache/epub/2701/pg2701-images.html', 'Fiction'],

        // --- Science -----
        ['Fragments of Science: A Series of Detached Essays, Addresses, and Reviews', 'John Tyndall', 'Exploring the fundamental principles of physics and the natural sciences.', 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=1000&auto=format&fit=crop', 'https://www.gutenberg.org/cache/epub/24527/pg24527-images.html', 'Science'],
        ['Reflections on the Decline of Science in England, and on Some of Its Causes', 'Charles Babbage', 'The volume addresses various factors contributing to the observed decline in scientific inquiry, particularly in the more complex and abstract disciplines.', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1000&auto=format&fit=crop', 'https://www.gutenberg.org/cache/epub/1216/pg1216-images.html', 'Science'],
    ];

    sampleBooks.forEach((book) => {
        const stmt = `INSERT INTO books (title, author, description, book_cover, pdf_url, genre) VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.run(stmt, book, (err) => {
            if (err) console.error("Seed error for " + book[0] + ":", err.message);
            else console.log(`Seeded: ${book[0]} [${book[5]}]`);
        });
    });
};

//Uncomment this if done generated data
//seedBooks();

// Start Server
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud Server running at http://10.0.0.0:${PORT}`);
});