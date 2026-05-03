import React, { useEffect, useState, useCallback } from 'react';
import { 
    Text, View, FlatList, TouchableOpacity, StyleSheet, 
    Alert, ActivityIndicator, ToastAndroid, Image, Modal, ScrollView 
} from 'react-native';
import { styles } from '../SharedStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { db } from '../services/database';
import * as WebSocketService from '../services/WebSocketService';

interface Book {
    id: string | number;
    book_id: string;
    title: string;
    author: string;
    book_cover: string;
    description: string;
    genre?: string;
    pdf_url?: string;
    borrowed_time?: string;
    is_my_loan?: number | string;
}

const SavedScreen = ({ navigation, route }: any) => {
    const [activeTab, setActiveTab] = useState('Wishlist');
    const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
    const [wishlistBooks, setWishlistBooks] = useState<Book[]>([]);
    const [wishlistIds, setWishlistIds] = useState<string[]>([]); 
    const [loading, setLoading] = useState(false);
    const isFocused = useIsFocused();
    const [books, setBooks] = useState<Book[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);


    const handleBorrow = async (book: Book) => {
       const studentId = await AsyncStorage.getItem('currentUserId');
        if (!studentId) return;

        const result = await WebSocketService.borrowBookHTTP(studentId, book.id);

        if (result && !result.error) {
            setModalVisible(false);
            
            WebSocketService.notifyBookBorrowed(book.title);
            
           Alert.alert("Success", "Borrowed successfully!", [
            {
                text: "View in Library",
                onPress: () => navigation.navigate('Saved', { 
                    initialTab: 'On Read', 
                    borrowedBook: { ...book, book_id: book.id } 
                })
            },
            { text: "OK" }
        ]);

        fetchBooks(); 
    } else {
        Alert.alert("Error", result.error || "Could not borrow book.");
    }
    };
     const loadWishlistStatus = useCallback(() => {
            db.transaction((tx) => {
                tx.executeSql(
                    'SELECT book_id FROM wishlist',
                    [],
                    (_, results) => {
                        let ids = [];
                        for (let i = 0; i < results.rows.length; i++) {
                            ids.push(results.rows.item(i).book_id.toString());
                        }
                        setWishlistIds(ids);
                    }
                );
            });
        }, []);
    

        const fetchBooks = async () => {
        const studentId = await AsyncStorage.getItem('currentUserId');
        setLoading(true);
        
        const cloudBooks = await WebSocketService.fetchEachStudentsBooks(Number(studentId) || 0);
        if (cloudBooks) {
            setBooks(cloudBooks);
        }
        setLoading(false);
    };

        useEffect(() => {
            if (isFocused) {
                fetchBooks();
                WebSocketService.fetchLocalWishlist();
                WebSocketService.setupSocketListeners({
                    onNotification: (data: any) => {
                        ToastAndroid.show(data.message, ToastAndroid.SHORT);
                    },
                    onInventoryChange: () => {
                        fetchBooks();
                    },
                    onBooksReceived: (updatedBooks: Book[]) => {
                        setBooks(updatedBooks);
                    }
                });
            }

            return () => {
                WebSocketService.socket.off('receive_books');
                WebSocketService.socket.off('notification');
            };
        }, [isFocused, loadWishlistStatus]);
        const handlePressBook = (book: Book) => {
            setSelectedBook(book);
            setModalVisible(true);
        };

    const fetchLocalWishlistIds = useCallback(async () => {
        const studentId = await AsyncStorage.getItem('currentUserId');
        if (!studentId) return;

        db.transaction((tx) => {
            tx.executeSql(
                'SELECT book_id FROM wishlist WHERE student_id = ?',
                [studentId],
                (_, results) => {
                    let tempIds = [];
                    for (let i = 0; i < results.rows.length; i++) {
                        tempIds.push(results.rows.item(i).book_id.toString());
                    }
                    setWishlistIds(tempIds);
                }
            );
        });
    }, []);

    useEffect(() => {
        if (!isFocused) return;

        fetchLocalWishlistIds();

        const syncCloud = async () => {
            const studentId = await AsyncStorage.getItem('currentUserId');
            WebSocketService.fetchAllBooksWS(Number(studentId));
        };
        syncCloud();

        const handleReceiveBooks = (data: Book[]) => {
            console.log("☁️ Cloud Data Received. Processing...");
            
            const myLoans = data.filter(b => Number(b.is_my_loan) === 1);
            setBorrowedBooks(myLoans);

            const myWishlist = data.filter(b => 
                wishlistIds.includes(b.id.toString()) || 
                wishlistIds.includes(b.book_id?.toString())
            );
            setWishlistBooks(myWishlist);
        };

        WebSocketService.socket.on("receive_books", handleReceiveBooks);

        return () => {
            console.log("Cleaning up WebSocket listener...");
            WebSocketService.socket.off("receive_books", handleReceiveBooks);
        };
    }, [isFocused, wishlistIds, fetchLocalWishlistIds]);

    const handleRemoveWishlist = async (bookId: string) => {
        const studentId = await AsyncStorage.getItem('currentUserId');
        db.transaction((tx) => {
            tx.executeSql(
                'DELETE FROM wishlist WHERE book_id = ? AND student_id = ?',
                [bookId, studentId],
                async () => {
                    ToastAndroid.show("Removed from Wishlist", ToastAndroid.SHORT);
                    await WebSocketService.toggleWishlist(studentId, bookId, 'remove');
                    fetchLocalWishlistIds();
                }
            );
        });
    };

    const handleReturnBook = async (bookId: number) => {
        const studentId = await AsyncStorage.getItem('currentUserId');
        Alert.alert("Return Book", "Return this book to the library?", [
            { text: "Cancel", style: "cancel" },
            { text: "Return", style: "destructive", onPress: async () => {
                const response = await fetch(`http://10.0.2.2:5000/api/loans/${studentId}/${bookId}`, { method: 'DELETE' });
                if (response.ok) {
                    WebSocketService.socket.emit("send_message", { message: "🔄 Book returned!" });
                    fetchLocalWishlistIds(); 
                }
            }}
        ]);
    };

    const renderItem = ({ item }: { item: Book }) => (
        <View style={styles.bookCard}>
            <Image source={{ uri: item.book_cover }} style={{ width: 50, height: 75, borderRadius: 5, marginRight: 15 }} />
            <View style={styles.textContainer}>
                <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                {/* Display Borrow Time only for 'On Read' books */}

                {activeTab === 'On Read' && item.borrowed_time && (
                <Text style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>
                    Borrowed: {new Date(item.borrowed_time).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    })}
                </Text>
            )}
                <TouchableOpacity onPress={() => activeTab === 'Wishlist' ? handleRemoveWishlist(item.id.toString()) : handleReturnBook(item.id as number)}>
                    <Text style={{ color: '#E53E3E', fontSize: 14, marginTop: 7 }}>
                        {activeTab === 'Wishlist' ? '✕ Remove' : '↺ Return'}
                    </Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity 
                style={[styles.statusBadge, { backgroundColor: activeTab === 'Wishlist' ? '#C6F6D5' : '#0043fcff' }]}
                onPress={() => {
                    if (activeTab === 'On Read') {
                        navigation.navigate('PDFReader', { pdfUrl: item.pdf_url, title: item.title });
                    } else {
                        setSelectedBook(item);
                        setModalVisible(true);
                    }
                }}
            >
                <Text style={{ color: activeTab === 'Wishlist' ? '#22543D' : 'white', fontWeight: 'bold' }}>
                    {activeTab === 'Wishlist' ? 'VIEW' : 'READ'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.mainContainer}>
            <Text style={styles.header}>My Library</Text>
            
            <View style={localStyles.tabContainer}>
                <TouchableOpacity style={[localStyles.tabButton, activeTab === 'Wishlist' && localStyles.activeTab]} onPress={() => setActiveTab('Wishlist')}>
                    <Text style={[localStyles.tabText, activeTab === 'Wishlist' && localStyles.activeTabText]}>Wishlist</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[localStyles.tabButton, activeTab === 'On Read' && localStyles.activeTab]} onPress={() => setActiveTab('On Read')}>
                    <Text style={[localStyles.tabText, activeTab === 'On Read' && localStyles.activeTabText]}>On Read ({borrowedBooks.length})</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={activeTab === 'Wishlist' ? wishlistBooks : borrowedBooks}
                renderItem={renderItem}
                keyExtractor={(item) => (item.id || item.book_id).toString()}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>Your {activeTab} is empty.</Text>}
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.BookModalContainer}>
                    <View style={styles.BookModalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                            <Image source={require('../../icons/close.png')} style={styles.modalCloseImage} />
                        </TouchableOpacity>

                        {selectedBook && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{ alignItems: 'center' }}>
                                    <Image source={{ uri: selectedBook.book_cover }} style={[styles.modalImage, { width: 150, height: 200 }]} />
                                </View>
                                <View style={styles.BookTextContainer}>
                                    <Text style={styles.modalGenre}>{selectedBook.genre}</Text>
                                    <Text style={styles.modalTitle}>{selectedBook.title}</Text>
                                    <Text style={styles.modalAuthor}>By {selectedBook.author}</Text>
                                    <View style={[styles.divider, { marginVertical: 10, width: '100%' }]} />
                                    <Text style={styles.modalDescriptionTitle}>Description</Text>
                                    <Text style={styles.BookModalDescription}>{selectedBook.description}</Text>
                                </View>

                                <TouchableOpacity 
                                    style={[styles.loginButton, { 
                                        width: '100%', height: 45, marginTop: 15,
                                        backgroundColor: selectedBook.is_my_loan === 1 ? '#718096' : '#0043fcff'
                                    }]}
                                    onPress={() => {
                                        if (selectedBook.is_my_loan === 1) {
                                            setModalVisible(false);
                                            navigation.navigate('Saved', { 
                                                initialTab: 'On Read', 
                                                borrowedBook: { ...selectedBook, book_id: selectedBook.id }
                                            });
                                        } else {
                                            handleBorrow(selectedBook);
                                        }
                                    }}
                                >
                                    <Text style={styles.loginButtonText}>
                                        {selectedBook.is_my_loan === 1 ? 'In Your Library' : 'Borrow Book'}
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const localStyles = StyleSheet.create({
    tabContainer: { flexDirection: 'row', backgroundColor: '#EDF2F7', borderRadius: 12, padding: 4, marginBottom: 20, marginHorizontal: 20 },
    tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    activeTab: { backgroundColor: 'white', elevation: 2 },
    tabText: { fontSize: 14, fontWeight: 'bold', color: '#718096' },
    activeTabText: { color: '#0043fcff' },
});

export default SavedScreen;