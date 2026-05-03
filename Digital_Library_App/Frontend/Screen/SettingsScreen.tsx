import React, {useState, useEffect, useRef} from 'react';
import { Text, View, Modal, TouchableOpacity, TextInput, Alert, Image, ToastAndroid, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../SharedStyles';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {RootTabParams} from '../App'
import Geolocation from '@react-native-community/geolocation';
import { createMapLink } from 'react-native-open-maps';
import { db } from '../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {WebView} from 'react-native-webview'
import * as WebSocketService from '../services/WebSocketService';

import Icon from 'react-native-vector-icons/MaterialIcons';

export type Props = BottomTabScreenProps<RootTabParams, 'Settings'>;

const SettingsScreen = ({navigation}: Props) => {
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [currentUsername, setCurrentUsername] = useState<string>('User'); // Default fallback
    const [modalUsernameVisible, setModalUsernameVisible] = useState(false);
    const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
    const [modalLogoutVisible, setModalLogoutVisible] = useState(false);
    const [modalAboutUsVisible, setModalAboutUsVisible] = useState(false);
    const [showWebView, setShowWebView] = useState(false);
    const [mapUrl, setMapUrl] = useState('');
    const [mapstartUrl, setMapStartUrl] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const criteria = [
        { label: 'At least 8 characters', valid: newPassword.length >= 8 },
        { label: 'At least one uppercase letter', valid: /[A-Z]/.test(newPassword) },
        { label: 'At least one number', valid: /[0-9]/.test(newPassword) },
        { label: 'At least one special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
    ];

    
    
    const allValid = criteria.every(item => item.valid);

    useEffect(() => {
    const fetchUserData = async () => {
        const id = await AsyncStorage.getItem('currentUserId');
        const name = await AsyncStorage.getItem('currentUserName');
        
        if (id) setCurrentId(id);
        if (name) setCurrentUsername(name);
    };

    fetchUserData();
}, []);


    // --- LOGIC FOR USERNAME CHANGE ---
    const handleUpdateUsername = async () => {
    const studentId = await AsyncStorage.getItem('currentUserId');
    if (!studentId) return;

    // Validation
    if (newUsername.length < 6 || /[ !@#$%^&*(),.?":{}|<>]/.test(newUsername)) {
        Alert.alert('Invalid Username', 'Minimum 6 characters, no special characters.');
        return;
    }

    try {
        const result = await WebSocketService.updateUsernameCloud(studentId, newUsername);

        if (result.success) {
            db.transaction((tx) => {
                tx.executeSql(
                    'UPDATE students SET username = ? WHERE id = ?',
                    [newUsername, studentId],
                    async () => {
                        await AsyncStorage.setItem('currentUserName', newUsername);
                        setCurrentUsername(newUsername);
                        setModalUsernameVisible(false);
                        setNewUsername('');
                        ToastAndroid.show('Username updated everywhere!', ToastAndroid.SHORT);
                    }
                );
            });
        } else {
            Alert.alert("Error", result.error);
        }
    } catch (error) {
        Alert.alert("Connection Error", "Could not connect to the server.");
    }
};

    // --- LOGIC FOR PASSWORD CHANGE ---
    const handleUpdatePassword = async () => {
        const studentId = await AsyncStorage.getItem('currentUserId');
        if (!studentId) return;

        if (!allValid || newPassword !== confirmPassword) {
            Alert.alert('Error', 'Please check password criteria and ensure passwords match.');
            return;
        }

        try {
        // Call the Cloud Service
        const result = await WebSocketService.updatePasswordCloud(studentId, newPassword);

        if (result.success) {
    db.transaction((tx) => {
        tx.executeSql(
            'UPDATE students SET username = ? WHERE id = ?',
            [newUsername, studentId],
            async () => {
                await AsyncStorage.setItem('currentUserName', newUsername);
                setCurrentUsername(newUsername);
                
                ToastAndroid.show('Username updated!', ToastAndroid.SHORT);
                setModalUsernameVisible(false);
            }
        );
    });
        }
    } catch (error) {
        Alert.alert("Network Error", "Unable to reach the server.");
    }
};

    const openModal = (action: string) => {
        if(action === 'Change Username') {
            setModalUsernameVisible(true);
        } 
        if (action === 'Change Password') {
            setModalPasswordVisible(true);
        }
        if (action === 'Logout') {
            setModalLogoutVisible(true);
        }
        if (action === 'About Us') {
            setModalAboutUsVisible(true);
        }
    };

    const deviceHeight = Dimensions.get('window').height;
    const deviceWidth = Dimensions.get('window').width;

    const handleGetDirections = (campus: string) => { 
        const destination = campus === 'sungai long' 
            ? '3.0396443,101.7942363' 
            : '4.3348363,101.1351317';

        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destination}&travelmode=driving`;
                setMapUrl(url);
                setShowWebView(true);
            },
            (error) => {
                console.error(error);
                setMapUrl(`https://www.google.com/maps/dir/?api=1&origin=Kuala+Lumpur&destination=${destination}&travelmode=driving`);
                setShowWebView(true);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    }


    return (
        <View style={styles.settingcontainer}>
            <Text style={styles.header}>Settings</Text>
            <TouchableOpacity 
                style={styles.optionCard}   
                onPress={() => openModal('Change Username')}>
                <Text style={styles.optionText}>Change Username</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.optionCard}   
                onPress={() => openModal('Change Password')}>
                <Text style={styles.optionText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.optionCard}   
                onPress={() => openModal('About Us')}>
                <Text style={styles.optionText}>About Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionCard, styles.logoutOptionCard]} onPress={() => openModal('Logout')}>
                <Text style={styles.optionLogoutText}>Logout</Text>
            </TouchableOpacity>


            {/* change username pop up window */}
            <Modal
                animationType='slide'
                transparent={true}
                visible={modalUsernameVisible}
                onRequestClose={()=> setModalUsernameVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Change Username:</Text>
                        <TextInput 
                            style={styles.modalTextInput}
                            placeholder="Enter new username"
                            value={newUsername}
                            onChangeText={setNewUsername}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setModalUsernameVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]} 
                                onPress={handleUpdateUsername} // Trigger Sync
                            >
                                <Text style={[styles.modalButtonText, { color: 'white' }]}>Confirm</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                    
                </View>
            </Modal>


            {/* change password pop up window */}
            <Modal
                animationType='slide'
                transparent={true}
                visible={modalPasswordVisible}
                onRequestClose={()=> setModalPasswordVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Change Password:</Text>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => setPasswordVisible(!isPasswordVisible)}
                        >
                            <Image
                                source={isPasswordVisible
                                    ? require('../../icons/view.png')
                                    : require('../../icons/hide.png')
                                }
                                style={{ width: 27, height: 27, bottom: 10, left: 120 }}
                            />
                        </TouchableOpacity>
                        <TextInput 
                            style={styles.modalTextInput}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!isPasswordVisible}
                        />
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => setPasswordVisible(!isPasswordVisible)}
                        >
                        </TouchableOpacity>
                        <TextInput 
                            style={styles.modalTextInput}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!isPasswordVisible}
                        />

                        {!allValid && newPassword.length > 0 && (
                            <View style={styles.criteriaContainer}>
                                {criteria.map((item, index) => (
                                    <Text 
                                        key={index} 
                                        style={[
                                            styles.criteriaText, 
                                            item.valid ? styles.criteriaValid : styles.criteriaInvalid
                                        ]}
                                    >
                                        {item.valid ? '✓' : 'x'} {item.label}
                                    </Text>
                                ))}
                            </View>
                        )}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setModalPasswordVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]} 
                                onPress={handleUpdatePassword} // Trigger Sync
                            >
                                <Text style={[styles.modalButtonText, { color: 'white' }]}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                </View>
            </Modal>

            
            {/* Logout pop up window */}
            <Modal
                animationType='slide'
                transparent={true}
                visible={modalLogoutVisible}
                onRequestClose={()=> setModalLogoutVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Are you sure you want to logout?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setModalLogoutVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.logoutButton]} onPress={() => {
                                Alert.alert('Confirm Logout?', `${currentUsername}`, [
                                    {
                                        text: 'Yes',
                                        onPress: async () => {
                                            setModalLogoutVisible(false);
                                            await AsyncStorage.clear();
                                            navigation.navigate('Login' as any);
                                            ToastAndroid.show('Logout Successful', ToastAndroid.LONG);
                                        },
                                    },
                                    {text: 'No', onPress: () => {}},
                                ]);
                            }}>
                                <Text style={[styles.modalButtonText, { color: 'white' }]}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
             </Modal>

            {/* About Us pop up window */}
            <Modal
                animationType='slide'
                transparent={true}
                visible={modalAboutUsVisible}
                onRequestClose={()=> setModalAboutUsVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>About Us</Text>
                        <Text style={{textAlign: 'center', marginBottom: 15, color: '#000000'}}>
                            Digital Library App{'\n'}Version 1.0.0{'\n\n'}A modern library management system for students and administrators.{'\n\n'}📞 Customer Service:{'\n'} 03-9086 0288{'\n\n'}📍 Location:{'\n'} Sungai Long Campus:{'\n'} Jalan Sungai Long, Bandar Sungai Long, Cheras, 43000 Kajang, Selangor Darul Ehsan, Malaysia.{'\n\n'} Kampar Campus:{'\n'} Universiti Tunku Abdul Rahman (UTAR) Kampus Kampar,
                            Jalan Universiti, Bandar Barat, 31900 Kampar, Perak Darul Ridzuan, Malaysia
                        </Text>
                        <TouchableOpacity 
                            style={{ width: '100%', flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 10, elevation: 3 }}
                            onPress={() =>handleGetDirections('sungai long')}
                        >
                            <Icon name="directions" size={30} color="#0145ffff" />
                            <View style={{ marginLeft: 15 }}>
                            <Text style={{ color: 'black', fontSize: 18, fontWeight: 'bold' }}>Customer Service</Text>
                            <Text style={{ color: 'gray' }}>Navigate to UTAR Sungai Long Campus</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={{ width: '100%', flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 10, elevation: 3, marginTop: 10 }}
                            onPress={() =>handleGetDirections('kampar')}
                        >
                            <Icon name="directions" size={30} color="#0145ffff" />
                            <View style={{ marginLeft: 15 }}>
                            <Text style={{ color: 'black', fontSize: 18, fontWeight: 'bold' }}>Customer Service</Text>
                            <Text style={{ color: 'gray' }}>Navigate to UTAR Kampar Campus</Text>
                            </View>
                        </TouchableOpacity>
                        <Text style={{ textAlign: 'center', color: '#000000' }}>
                            {'\n\n'}© 2026 All rights reserved.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={() => setModalAboutUsVisible(false)}>
                                <Text style={[styles.modalButtonText, { color: 'white' }]}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
             </Modal>
             <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)}>
                <View style={{ flex: 1 }}>
                    <View style={{ height: 60, backgroundColor: '#0145ffff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 }}>
                        <TouchableOpacity onPress={() => setShowWebView(false)}>
                            <Icon name="close" size={30} color="white" />
                        </TouchableOpacity>
                        <Text style={{ color: 'white', fontSize: 18, marginLeft: 20, fontWeight: 'bold' }}>Campus Map</Text>
                    </View>
                    
                    <WebView 
                        source={{ uri: mapUrl }}
                        style={{ 
                            width: deviceWidth, 
                            height: deviceHeight * .8 
                        }} 
                        scalesPageToFit={true}
                        geolocationEnabled={true} 
                    />
                </View>
            </Modal>
         </View>
     );
}

export default SettingsScreen;