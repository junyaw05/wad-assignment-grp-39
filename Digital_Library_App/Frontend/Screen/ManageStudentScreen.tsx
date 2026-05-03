import React,{useState, useEffect, useCallback} from 'react';
import { Text, View, Image, TextInput, TouchableOpacity, Alert, FlatList, Modal, ScrollView, ToastAndroid} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useIsFocused } from '@react-navigation/native';
import { styles } from '../SharedStyles';
import {RootStackParamList} from '../App';
import SQLite from 'react-native-sqlite-storage';
import * as WebSocketService from '../services/WebSocketService';

export type Props = StackScreenProps<RootStackParamList, 'ManageStudent'>;
   
export const db = SQLite.openDatabase(
  { name: 'library.sqlite', location: 'default' },
  () => console.log('Admin: Local Database connected'),
  (error) => console.error('Database connection error', error)
);

const ManageStudentScreen = ({ route, navigation }: Props) => {
    const [students, setStudents] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState(''); 
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const isFocused = useIsFocused();
    const itemsPerPage = 6;

    const filteredStudents = students.filter(student => 
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        setCurrentPage(1);
    };
    
    const fetchAllStudents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://10.0.2.2:5000/api/students`);
            if (response.ok) {
                const data = await response.json();
                setStudents(data);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isFocused) {
            fetchAllStudents();
            WebSocketService.connect();

        const handleCreateResult = (result: any) => {
            if (result.success) {
                setModalVisible(false);
                setNewUsername(''); 
                setNewEmail(''); 
                setNewPassword('');
                Alert.alert("Success", "Student added successfully!");
                fetchAllStudents(); 
            } else {
                Alert.alert("Error", result.error || "Failed to add student.");
            }
        };


        const socket = WebSocketService.socket;
            if (socket) {

                socket.on('student_create_result',handleCreateResult);
                
            }

            return () => {
                if (socket) {
                    socket.off('student_create_result', handleCreateResult);
                }
            };
        }
    }, [isFocused]);

    const criteria = [
        { label: 'At least 8 characters', valid: newPassword.length >= 8 },
        { label: 'At least one uppercase letter', valid: /[A-Z]/.test(newPassword) },
        { label: 'At least one number', valid: /[0-9]/.test(newPassword) },
        { label: 'At least one special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
    ];
    const allValid = criteria.every(item => item.valid);
    const isEmailValid = newEmail.includes('@1utar.my') && newEmail.length >= 15;
    const isUsernameValid = newUsername.length > 5 && /[ !@#$%^&*(),.?":{}|<>]/.test(newUsername) === false;

    const handleAddingStudent = async () => {
    if (!isEmailValid || !isUsernameValid || !allValid) {
        Alert.alert("Error", "Please check your input criteria.");
        return;
    }
    WebSocketService.requestStudentCreate({ 
            username: newUsername, 
            email: newEmail, 
            password: newPassword 
    });
        
    };
    

    const deleteStudent = (id: number) => {
        Alert.alert(
            "Confirm Delete",
            "Remove this student from the Cloud Database?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        const URL = `http://10.0.2.2:5000/api/students/${id}`;
                        
                        try {
                            const response = await fetch(URL, { 
                                method: 'DELETE'                             
                            });

                            if (response.ok) {
                                Alert.alert("Success", "Student removed from Cloud.");
                                fetchAllStudents();
                            } else {
                                Alert.alert("Error", "Server failed to delete the student.");
                            }
                        } catch (error) {
                            console.error("Cloud Delete Error:", error);
                            Alert.alert("Network Error", "Could not connect to the server.");
                        }
                    } 
                }
            ]
        );
    };

    const renderStudentItem = ({ item } : { item: any }) => (
        <View style={styles.bookCard}>
            <View style={[styles.iconCircle, { backgroundColor: item.rank === 1 ? '#FFD700' : '#E2E8F0' }]}>
                <Text style={{ fontWeight: 'bold' }}>{item.id}</Text>
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.bookTitle}>{item.username}</Text>
                <Text style={styles.bookAuthor}>{item.email}</Text>
            </View>
            <TouchableOpacity 
                style={[styles.statusBadge, { backgroundColor: '#C53030' }]} 
                onPress={() => deleteStudent(item.id)}
            >
                <Text style={[styles.statusText, { color: 'white' }]}>DELETE</Text>
            </TouchableOpacity>
        </View>


    );

    return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>

        <View style={{ padding: 10 }}>
                <TextInput
                    style={[styles.inputTextBox, { marginBottom: 5 }]}
                    placeholder="Search by student email..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                <TouchableOpacity 
                    style={[styles.loginButton, { width: 150 }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.loginButtonText}>Add Student</Text>
                </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
            <FlatList
                data={currentItems}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderStudentItem}
                contentContainerStyle={{ paddingHorizontal: 10,paddingBottom: 20 }}
                ListEmptyComponent={
                    <View style={styles.contentCenter}>
                        <Text style={styles.emptyText}>No students registered yet.</Text>
                    </View>
                }
            />
        </View>

        {/* --- PAGINATION CONTROLS --- */}
        {filteredStudents.length > itemsPerPage && (
            <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: 15, 
                backgroundColor: '#F7FAFC',
                borderTopWidth: 1,
                borderColor: '#E2E8F0',
                elevation: 5,
            }}>
                <TouchableOpacity 
                    disabled={currentPage === 1}
                    onPress={() => {
                        setCurrentPage(prev => prev - 1);
                    }}
                    style={{ padding: 10, opacity: currentPage === 1 ? 0.3 : 1 }}
                >
                    <Text style={{ color: '#2B6CB0', fontWeight: 'bold' }}>PREVIOUS</Text>
                </TouchableOpacity>

                <Text style={{ fontWeight: '500', marginRight:30 }}>
                    Page {currentPage} of {totalPages}
                </Text>

                <TouchableOpacity 
                    disabled={currentPage === totalPages}
                    onPress={() => {
                        setCurrentPage(prev => prev + 1);
                    }}
                    style={{ padding: 10, opacity: currentPage === totalPages ? 0.3 : 1 }}
                >
                    <Text style={{ color: '#2B6CB0', fontWeight: 'bold' }}>NEXT</Text>
                </TouchableOpacity>
            </View>
        )}
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalText}>Add New Student</Text>

                    <TextInput
                        style={styles.inputTextBox}
                        placeholder="Email"
                        value={newEmail}
                        onChangeText={setNewEmail}
                    />

                    <TextInput
                        style={styles.inputTextBox}
                        placeholder="Username"
                        value={newUsername}
                        onChangeText={setNewUsername}
                    />

                    <View style={styles.passwordTextBox}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!isPasswordVisible}
                        />
                        {newPassword.length > 0 && (
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => setPasswordVisible(!isPasswordVisible)}
                            >
                                <Image
                                    source={isPasswordVisible
                                        ? require('../../icons/view.png')
                                        : require('../../icons/hide.png')
                                    }
                                    style={{ width: 24, height: 24 }}
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {!allValid && (
                        <View style={styles.criteriaContainer}>
                            {criteria.map((item, index) => (
                                <Text 
                                    key={index} 
                                    style={[
                                        styles.criteriaText, 
                                        newPassword.length > 0 
                                            ? (item.valid ? styles.criteriaValid : styles.criteriaInvalid) 
                                            : { color: '#718096' }
                                    ]}
                                >
                                    {item.valid ? '✓' : 'x'} {item.label}
                                </Text>
                            ))}
                        </View>
                    )}
                    <View style={styles.pickersRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.loginButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.addStudentButton}
                            onPress={handleAddingStudent}
                        >
                            <Text style={styles.loginButtonText}>Add Student</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    </View>
    );
};

export default ManageStudentScreen;