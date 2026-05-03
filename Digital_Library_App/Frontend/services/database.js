import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(false); 

export const db = SQLite.openDatabase(
  { name: 'LibraryDB', location: 'default' },
  () => {
    db.transaction(tx => {
        tx.executeSql('PRAGMA foreign_keys = OFF;', [], 
            () => console.log('Foreign keys disabled'),
            (err) => console.log('Error disabling foreign keys', err)
        );
    });
  },
  error => console.log("Database Open Error: ", error)
);

export const setupDatabase = () => {
    db.transaction((tx) => {
        // Students Table
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                username TEXT, 
                email TEXT UNIQUE, 
                password TEXT
            )`
        );

            //books table
        tx.executeSql(`CREATE TABLE IF NOT EXISTS books (
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
        tx.executeSql(`CREATE TABLE IF NOT EXISTS loans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            book_id INTEGER,
            borrowed_time DATETIME,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        )`);


        // Wishlist Table
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS wishlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                student_id INTEGER, 
                book_id INTEGER -- Changed from cloud_id to book_id for consistency
            )`
        );
    }, (error) => {
        console.error("Transaction Error (Database Init):", error);
    }, () => {
        console.log("Database Tables Verified/Created Successfully");
    });
};