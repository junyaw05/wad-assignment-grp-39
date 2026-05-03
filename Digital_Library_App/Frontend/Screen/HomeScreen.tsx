import React, { useCallback, useEffect, useState } from 'react';
import { 
    Text, 
    View, 
    ScrollView, 
    FlatList, 
    TouchableOpacity, 
    Modal, 
    Alert, 
    Image, 
    ToastAndroid,
    ActivityIndicator 
} from 'react-native';

import { styles } from '../SharedStyles';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { db } from '../services/database'; 
import * as WebSocketService from '../services/WebSocketService';

interface Book {
    id: string;
    title: string;
    author: string;
    description: string;
    genre: string;
    book_cover?: string;
    pdf_url?: string;
    borrowed_time?: string;
    is_my_loan: number; 
}

const HomeScreen = ({ navigation }: any) => {
    const [books, setBooks] = useState<Book[]>([]);
    const [randomPicks, setRandomPicks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [wishlistIds, setWishlistIds] = useState<string[]>([]); 
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    
    const isFocused = useIsFocused();

    const fetchBooks = async () => {
        const studentId = await AsyncStorage.getItem('currentUserId');
        setLoading(true);
        
        const cloudBooks = await WebSocketService.fetchEachStudentsBooks(Number(studentId) || 0);
        
        if (cloudBooks && cloudBooks.length > 0) {
            setBooks(cloudBooks);
            
            const shuffled = [...cloudBooks].sort(() => 0.5 - Math.random());
            setRandomPicks(shuffled.slice(0, 6));
        }
        setLoading(false);
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

    useEffect(() => {
        if (isFocused) {
            fetchBooks();
            loadWishlistStatus();
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
            if (WebSocketService.socket) {
                WebSocketService.socket.off('receive_books');
                WebSocketService.socket.off('notification');
            }
        };
    }, [isFocused, loadWishlistStatus]);

    const toggleWishlist = async (book: Book) => {
        const studentId = await AsyncStorage.getItem('currentUserId');
        if (!studentId) return;

        const isLoved = wishlistIds.includes(book.id.toString());
        const action = isLoved ? 'remove' : 'add';

        db.transaction((tx) => {
            if (isLoved) {
                tx.executeSql('DELETE FROM wishlist WHERE book_id = ? AND student_id = ?', [book.id, studentId]);
            } else {
                tx.executeSql('INSERT INTO wishlist (student_id, book_id) VALUES (?, ?)', [studentId, book.id]);
            }
        });

        if (isLoved) {
            setWishlistIds(prev => prev.filter(id => id !== book.id.toString()));
        } else {
            setWishlistIds(prev => [...prev, book.id.toString()]);
        }

        try {
            await WebSocketService.toggleWishlist(studentId, book.id, action);
            ToastAndroid.show(`Wishlist ${isLoved ? 'Removed' : 'Added'}`, ToastAndroid.SHORT);
        } catch (err) {
            loadWishlistStatus(); 
        }
    };

    const handleBorrow = async (book: Book) => {
        const studentId = await AsyncStorage.getItem('currentUserId');
        if (!studentId) return;

        const result = await WebSocketService.borrowBookHTTP(studentId, book.id);

        if (result && !result.error) {
            setModalVisible(false);
            WebSocketService.notifyBookBorrowed(book.title);
            
            Alert.alert("Success", "Borrowed successfully!", [
                { text: "View in Library", onPress: () => navigation.navigate('Saved', { initialTab: 'On Read' }) },
                { text: "OK" }
            ]);
            fetchBooks(); 
        } else {
            Alert.alert("Error", result.error || "Could not borrow book.");
        }
    };

    const renderSquare = ({ item }: { item: Book }) => {
        const isLoved = wishlistIds.includes(item.id.toString());
        return (
            <View style={{ position: 'relative' }}>
                <TouchableOpacity
                    style={[styles.magazineCard, { width: 160, marginRight: 15 }]}
                    onPress={() => { setSelectedBook(item); setModalVisible(true); }}
                >
                    <View style={styles.coverPlaceholder}>
                        {item.book_cover ? (
                            <Image source={{ uri: item.book_cover }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                        ) : (
                            <Text style={styles.coverText}>{item.title.charAt(0)}</Text>
                        )}
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.dateText}>{item.author}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.wishlistIconContainer} onPress={() => toggleWishlist(item)}>
                    <Icon name={isLoved ? "heart" : "heart-outline"} size={22} color={isLoved ? "#E53E3E" : "#718096"} />
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#0043fcff" />
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
                <Text style={styles.header}>Home</Text>

                {/* Progress Bar */}
                <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                    <Text style={{ fontSize: 14, color: '#718096', fontWeight: '600' }}>
                        Books Borrowed: {books.filter(b => b.is_my_loan === 1).length} / 10
                    </Text>
                    <View style={{ height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 5 }}>
                        <View style={{ 
                            height: '100%', 
                            backgroundColor: books.filter(b => b.is_my_loan === 1).length >= 10 ? '#E53E3E' : '#0043fcff', 
                            width: `${(books.filter(b => b.is_my_loan === 1).length / 10) * 100}%`,
                            borderRadius: 2 
                        }} />
                    </View>
                </View>

                {/* Recommended Picks (6 Random Books) */}
                <Text style={[styles.header, { fontSize: 18, color: '#0043fcff' }]}>Recommended for You</Text>
                <FlatList
                    data={randomPicks}
                    renderItem={renderSquare}
                    keyExtractor={item => `random-${item.id}`}
                    numColumns={2}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingLeft: 20, paddingBottom: 20 }}
                />

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
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
                                    onPress={() => selectedBook.is_my_loan === 1 ? setModalVisible(false) : handleBorrow(selectedBook)}
                                >
                                    <Text style={styles.loginButtonText}>{selectedBook.is_my_loan === 1 ? 'In Your Library' : 'Borrow Book'}</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default HomeScreen;