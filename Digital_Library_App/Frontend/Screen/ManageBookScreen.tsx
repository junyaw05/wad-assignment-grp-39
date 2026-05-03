import React, { useEffect, useState, useMemo } from 'react';
import { Text, View, TextInput, TouchableOpacity, Alert, FlatList, Modal, ActivityIndicator, ScrollView, Dimensions, ToastAndroid} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import Pdf from 'react-native-pdf';
import { styles } from '../SharedStyles';
import { RootStackParamList } from '../App';
import { db } from '../Utils';

import * as WebSocketService from '../services/WebSocketService';

export type Props = StackScreenProps<RootStackParamList, 'ManageBook'>;

const ManageBookScreen = ({ route, navigation }: Props) => {
    const [books, setBooks] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');
    const [genre, setGenre] = useState('');
    
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    const [pdfToRead, setPdfToRead] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedBook, setSelectedBook] = useState<any>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const fetchAllBooks = async () => {
        
        setLoading(true);
        const URL = `http://10.0.2.2:5000/api/books`; 
        try {
            const response = await fetch(URL, {
                method: 'GET', 
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const cloudBooks = await response.json();
                setBooks(cloudBooks); 
            } else {
                Alert.alert("Error", "Could not fetch cloud users.");
            }
        } catch (error) {
            console.error("Cloud Fetch Error:", error);
            Alert.alert("Network Error", "Make sure your Node.js server is running on port 5000.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        WebSocketService.connect();
        fetchAllBooks();
        const handleLibraryUpdate = (data: any) => {
            console.log("Library update received:", data.action);
            fetchAllBooks(); 
            if (data.action === 'added') {
                ToastAndroid.show(`New Book: ${data.title}`, ToastAndroid.SHORT);
            }
        };

        const handleActionResult = (result: any) => {
            if (result.success) {
                if (result.action === 'added') {
                    setModalVisible(false);
                    setTitle(''); setAuthor(''); setDescription(''); setGenre(''); setCoverUrl(''); setPdfUrl('');
                    Alert.alert("Success", "Book added to cloud!");
                } else if (result.action === 'deleted') {
                    setDetailModalVisible(false);
                    Alert.alert("Deleted", "Book removed from cloud!");
                }
            } else {
                Alert.alert("Error", result.error || "Action failed");
            }
        };

        if (WebSocketService.socket) {
            WebSocketService.socket.on('library_update', handleLibraryUpdate);
            WebSocketService.socket.on('book_action_result', handleActionResult);
        }

        return () => {
            if (WebSocketService.socket) {
                WebSocketService.socket.off('library_update', handleLibraryUpdate);
                WebSocketService.socket.off('book_action_result', handleActionResult);
            }
        };
    }, [fetchAllBooks]);


    const filteredBooks = books.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBooks.slice(indexOfFirstItem, indexOfLastItem);



    const handleSearch = (text: string) => {
        setSearchQuery(text);
        setCurrentPage(1);
    };


    const handleAddBook = () => {
        if (!title || !author || !pdfUrl) {
            Alert.alert("Required Fields", "Please fill in Title, Author, and PDF URL.");
            return;
        }

        WebSocketService.socket?.emit('add_book', {
            title, author, description, genre,
            book_cover: coverUrl,
            pdf_url: pdfUrl
        });
    };

    const deleteBook = (id: any) => {
    console.log("Attempting to delete book ID:", id); 
    Alert.alert("Confirm Delete", "Remove this book from the Cloud?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => {
            if (WebSocketService.socket?.connected) {
                WebSocketService.socket.emit('delete_book', { id: Number(id) }); 
            } else {
                Alert.alert("Error", "Server not connected");
            }
        }}
    ]);
};

    const openBookDetails = (book: any) => {
        setSelectedBook(book);
        setDetailModalVisible(true);
    };

    const handleReadBook = (item: any) => {
        if (!item.pdf_url) {
            Alert.alert("Error", "No link available for this book.");
            return;
        }

        setDetailModalVisible(false);

        const isPdf = item.pdf_url.toLowerCase().endsWith('.pdf');

        if (isPdf) {
            navigation.navigate('PDFReader', { 
                pdfUrl: item.pdf_url, 
                title: item.title 
            });
        } else {
            navigation.navigate('WebViewReader', { 
                url: item.pdf_url, 
                title: item.title 
            });
        }
    };

    const renderBookItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.bookCard} onPress={() => openBookDetails(item)}>
            <View style={styles.iconCircle}>
                <Text style={{ fontWeight: 'bold' }}>{item.id}</Text>
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: '#2B6CB0' }]}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>VIEW</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* --- SEARCHBAR AND ADD BUTTON --- */}
            <View style={{ padding: 10 }}>
                <TextInput
                    style={[styles.inputTextBox, { marginBottom: 10 }]}
                    placeholder="Search by title or author..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                <TouchableOpacity 
                    style={[styles.loginButton, { width: 150 }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.loginButtonText}>Add Book</Text>
                </TouchableOpacity>
            </View>

            {loading && books.length === 0 && (<ActivityIndicator size="large" color="#2B6CB0" />)}

            <FlatList
                data={currentItems}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderBookItem}
                contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
                ListEmptyComponent={
                    <View style={styles.contentCenter}>
                        <Text style={styles.emptyText}>No books found.</Text>
                    </View>
                }
            />

            {/* --- PAGINATION CONTROLS --- */}
            {filteredBooks.length > itemsPerPage && (
                <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: 15, 
                    backgroundColor: '#F7FAFC',
                    borderTopWidth: 1,
                    borderColor: '#E2E8F0',
                }}>
                    <TouchableOpacity 
                        disabled={currentPage === 1}
                        onPress={() => setCurrentPage(prev => prev - 1)}
                        style={{ padding: 10, opacity: currentPage === 1 ? 0.3 : 1 }}
                    >
                        <Text style={{ color: '#2B6CB0', fontWeight: 'bold' }}>PREVIOUS</Text>
                    </TouchableOpacity>

                    <Text style={{ fontWeight: '500' }}>
                        Page {currentPage} of {totalPages}
                    </Text>

                    <TouchableOpacity 
                        disabled={currentPage === totalPages}
                        onPress={() => setCurrentPage(prev => prev + 1)}
                        style={{ padding: 10, opacity: currentPage === totalPages ? 0.3 : 1 }}
                    >
                        <Text style={{ color: '#2B6CB0', fontWeight: 'bold' }}>NEXT</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Modal animationType="fade" transparent={true} visible={detailModalVisible}>
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.modalTitle, { color: '#2B6CB0' }]}>Book Details</Text>
                            
                            <Text style={styles.modalDescriptionTitle}>Title:</Text>
                            <Text style={styles.modalDescription}>{selectedBook?.title}</Text>

                            <Text style={styles.modalDescriptionTitle}>Author:</Text>
                            <Text style={styles.modalDescription}>{selectedBook?.author}</Text>

                            <Text style={styles.modalDescriptionTitle}>Genre:</Text>
                            <Text style={styles.modalDescription}>{selectedBook?.genre || 'N/A'}</Text>

                            <Text style={styles.modalDescriptionTitle}>Description:</Text>
                            <Text style={styles.modalDescription}>{selectedBook?.description || 'No description available.'}</Text>

                            <Text style={styles.modalDescriptionTitle}>PDF Link:</Text>
                            <Text style={styles.modalDescription} numberOfLines={1}>{selectedBook?.pdf_url}</Text>
                        </ScrollView>

                        <TouchableOpacity 
                            style={[styles.loginButton, { width: '100%', backgroundColor: '#38A169' }]} 
                            onPress={() => handleReadBook(selectedBook)}
                        >
                            <Text style={styles.loginButtonText}>📖 Read Book</Text>
                        </TouchableOpacity>

                        <View style={styles.pickersRow}>
                            <TouchableOpacity 
                                style={[styles.cancelButton]} 
                                onPress={() => setDetailModalVisible(false)}
                            >
                                <Text style={styles.loginButtonText}>Close</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.cancelButton]} 
                                onPress={() => WebSocketService.requestBookDelete(selectedBook.id)}
                            >
                                <Text style={styles.loginButtonText}>Delete Book</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal animationType="slide" transparent={true} visible={modalVisible}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Add New Book</Text>
                        <TextInput style={styles.inputTextBox} placeholder="Book Title" value={title} onChangeText={setTitle} />
                        <TextInput style={styles.inputTextBox} placeholder="Book Author" value={author} onChangeText={setAuthor} />
                        <TextInput style={styles.inputTextBox} placeholder="Description" value={description} onChangeText={setDescription} />
                        <TextInput style={styles.inputTextBox} placeholder="Genre" value={genre} onChangeText={setGenre} />
                        <TextInput style={styles.inputTextBox} placeholder="Cover URL" value={coverUrl} onChangeText={setCoverUrl} />
                        <TextInput style={styles.inputTextBox} placeholder="PDF URL" value={pdfUrl} onChangeText={setPdfUrl} />

                        <View style={styles.pickersRow}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.loginButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addStudentButton} onPress={handleAddBook}>
                                <Text style={styles.loginButtonText}>Confirm Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ManageBookScreen;