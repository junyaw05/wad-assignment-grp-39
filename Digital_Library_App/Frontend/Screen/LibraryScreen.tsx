import React, { useState, useEffect,useCallback} from 'react';
import { Text, View, TextInput, FlatList, TouchableOpacity,ScrollView,Alert, ActivityIndicator, Modal, Image, ToastAndroid} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { styles } from '../SharedStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebSocketService from '../services/WebSocketService';
import {db} from '../services/database';

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

const LibraryScreen = ({navigation, route}: any) => {
    const [search, setSearch] = useState('');
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [wishlistIds, setWishlistIds] = useState<string[]>([]); 
    const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
    const [wishlistBooks, setWishlistBooks] = useState<Book[]>([]);

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

    const toggleWishlist = async (book: Book) => {
        const studentId = await AsyncStorage.getItem('currentUserId');
        if (!studentId) return;

        const isLoved = wishlistIds.includes(book.id.toString());
        const action = isLoved ? 'remove' : 'add';

        db.transaction((tx) => {
            if (isLoved) {
                tx.executeSql('DELETE FROM wishlist WHERE book_id = ? AND student_id = ?', [book.id, studentId]);
            } else {
                tx.executeSql(
                    'INSERT INTO wishlist (student_id, book_id) VALUES (?, ?)',
                    [studentId, book.id]
                );
            }
        });

        if (isLoved) {
            setWishlistIds(prev => prev.filter(id => id !== book.id.toString()));
        } else {
            setWishlistIds(prev => [...prev, book.id.toString()]);
        }

        const result = await WebSocketService.toggleWishlist(studentId, book.id, action);
        if (result && result.success) {
            ToastAndroid.show(`Wishlist ${action === 'add' ? 'Added' : 'Removed'}`, ToastAndroid.SHORT);
            
            if (action === 'add') {
                WebSocketService.socket.emit("send_message", { 
                    message: `Someone added "${book.title}" to their wishlist!` 
                });
            }
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const studentId = await AsyncStorage.getItem('currentUserId');
            if (!studentId) return;

            WebSocketService.fetchAllBooksWS(Number(studentId));

            db.transaction((tx) => {
                tx.executeSql(
                    'SELECT * FROM wishlist WHERE student_id = ?', 
                    [studentId], 
                    (_, results) => {
                        let temp = [];
                        for (let i = 0; i < results.rows.length; i++) {
                            temp.push(results.rows.item(i));
                        }
                        setWishlistBooks(temp);
                    }
                );
            });
        } catch (error) {
            console.error("Sync error:", error);
        } finally {
        }
    }, [leaderboardData.length]);

    const handleBorrow = async (book: Book) => {
        const studentId = await AsyncStorage.getItem('currentUserId');
        if (!studentId) return;

        const result = await WebSocketService.borrowBookHTTP(studentId, book.id);

        if (result && !result.error) {
            setModalVisible(false);
            
            WebSocketService.notifyBookBorrowed(book.title);
            
            Alert.alert("Success", "Book moved to your 'On Read' library!");
            
            fetchLeaderboard();
            fetchData(); 

        } else {
            Alert.alert("Error", result?.error || "Could not complete cloud sync.");
        }
    };

    const fetchLeaderboard = async () => {
            try {
                const response = await fetch('http://10.0.2.2:5000/api/books/leaderboard');
                const data = await response.json();
            
                const rankedData = data.map((item: any, index: number) => ({
                    ...item,
                    rank: index + 1
                }));
                
                setLeaderboardData(rankedData);
            } catch (error) {
                console.error("Leaderboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            WebSocketService.connect();
            fetchLeaderboard();
            fetchData()
        },[]);

   const PodiumColumn = ({ item, stageStyle, rank }: { item: Book, stageStyle: any, rank: string }) => {
    return (
        <View style={styles.podiumColumn}>
            <TouchableOpacity 
                style={[styles.magazineCard, { width: 85, height: 110, marginBottom: 5, padding: 0, overflow: 'hidden' }]}
                onPress={() => {
                    setSelectedBook(item);
                    setModalVisible(true);
                }}
            >
                <View style={[styles.coverPlaceholder, { height: '100%', marginBottom: 0 }]}>
                    {item?.book_cover && item.book_cover.startsWith('http') ? (
                        <Image 
                            source={{ uri: item.book_cover }} 
                            style={{ width: '100%', height: '100%' }} 
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={styles.coverText}>{item?.title?.charAt(0)}</Text>
                    )}
                </View>
            </TouchableOpacity>

            <View style={stageStyle}>
                <Text style={styles.podiumRankText}>{rank}</Text>
            </View>
        </View>
    );
};
    const renderLeaderboardItem = ({ item }: { item: any }) => (
        <View style={styles.bookCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E2E8F0' }]}>
                <Text style={{ fontWeight: 'bold' }}>{item.rank}</Text>
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.count} Borrows</Text>
            </View>
            <TouchableOpacity style={[styles.statusBadge, { backgroundColor: '#0043fcff' }]}
                onPress={() => {
                    setSelectedBook(item);
                    setModalVisible(true);    
                    }}
            >
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>View</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.mainContainer, {justifyContent: 'center'}]}>
                <ActivityIndicator size="large" color="#0043fcff" />
            </View>
        );
    }
    
    const filteredData = leaderboardData.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase())
    );
    const remainingData = filteredData.slice(3); 
    if (remainingData.length > 7) {
        remainingData.length = 7; 
    }

    const isSearching = search.length > 0;

    const listData = isSearching ? filteredData : filteredData.slice(3);

    const podiumData = isSearching ? [] : filteredData.slice(0, 3);

    const renderHeader = () => (
        <View style={{ paddingBottom: 10 }}>
            <Text style={styles.header}>Library</Text>
            <TextInput
                style={styles.searchBar}
                placeholder="Search all books..."
                value={search}
                onChangeText={setSearch}
            />
           {/* Only show Podium and title if NOT searching */}
        {!isSearching && (
            <>
                <Text style={[styles.header, { fontSize: 18, marginBottom: 0 }]}>
                    Most Popular Books
                </Text>
                {podiumData.length >= 3 && (
                    <View style={[styles.podiumContainer, { marginTop: 10 }]}> 
                        <PodiumColumn item={podiumData[1]} stageStyle={styles.secondPodiumStage} rank="2" />
                        <PodiumColumn item={podiumData[0]} stageStyle={styles.firstPodiumStage} rank="1" />
                        <PodiumColumn item={podiumData[2]} stageStyle={styles.thirdPodiumStage} rank="3" />
                    </View>
                )}
            </>
        )}

        {isSearching && (
            <Text style={[styles.header, { fontSize: 18, marginVertical: 10 }]}>
                Search Results ({filteredData.length})
            </Text>
        )}
    </View>
);
    if (loading) {
        return (
            <View style={[styles.mainContainer, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#0043fcff" />
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            <FlatList
                data={listData}
                renderItem={renderLeaderboardItem}
                keyExtractor={item => item.id.toString()}
                ListHeaderComponent={renderHeader}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    isSearching ? (
                        <Text style={{ textAlign: 'center', marginTop: 20, color: 'gray' }}>
                            No books match "{search}"
                        </Text>
                    ) : null
                }
                refreshing={loading}
                onRefresh={fetchLeaderboard}
            />
        {/* Modal for Book Details */}
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
                                <Image source={{ uri: selectedBook.book_cover }} style={[styles.modalImage, { width: 150, height: 210 }]} />
                            </View>
                            <View style={styles.BookTextContainer}>
                            <TouchableOpacity 
                                    style={{ alignSelf: 'flex-end', padding: 5 }} 
                                    onPress={() => toggleWishlist(selectedBook)}
                                >
                                    <Icon 
                                        name={wishlistIds.includes(selectedBook.id.toString()) ? "heart" : "heart-outline"} 
                                        size={28} 
                                        color={wishlistIds.includes(selectedBook.id.toString()) ? "#E53E3E" : "#718096"} 
                                    />
                                </TouchableOpacity>
                                <Text style={styles.modalGenre}>{selectedBook.genre|| 'General'}</Text>
                                <Text style={styles.modalTitle}>{selectedBook.title}</Text>
                                <Text style={styles.modalAuthor}>By {selectedBook.author}</Text>
                                <View style={[styles.divider, { marginVertical: 10, width: '100%' }]} />
                                <Text style={styles.modalDescriptionTitle}>Description</Text>
                                <Text style={styles.BookModalDescription}>{selectedBook.description}</Text>
                            </View>

                            <TouchableOpacity 
                                style={[styles.loginButton, { 
                                    width: '100%', 
                                    height: 48, 
                                    marginTop: 15,
                                    backgroundColor: borrowedBooks.some(b => b.title === selectedBook?.title) 
                                        ? '#CBD5E0' 
                                        : '#0043fcff'
                                }]}
                                disabled={borrowedBooks.some(b => b.title === selectedBook?.title)}
                                onPress={() => handleBorrow(selectedBook)}
                            >
                                <Text style={styles.loginButtonText}>
                                    {borrowedBooks.some(b => b.title === selectedBook?.title) 
                                        ? 'Already Borrowed' 
                                        : 'Borrow Now'}
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

export default LibraryScreen;