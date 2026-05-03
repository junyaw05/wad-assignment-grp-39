import React, { useState } from 'react';
import { Text, View, Image, TextInput, TouchableOpacity, Alert } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { styles } from '../SharedStyles'

import {RootStackParamList} from '../App'
import * as WebSocketService from '../services/WebSocketService';
import {db} from '../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
export type Props = StackScreenProps<RootStackParamList, 'Login'>;

interface User {
    id: string;
    username: string;
    email: string;
    password?: string;
}


const App = ({route, navigation}: Props) => {
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Input Required", "Please enter both email and password.");
            return;
        }

        try {
        const response = await fetch('http://10.0.2.2:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password }),
        });

        const result = await response.json();

        if (response.ok) {
            const user = result.user;
            db.transaction((tx) => {
                tx.executeSql(
                    'INSERT OR REPLACE INTO students (id, username, email, password) VALUES (?, ?, ?, ?)',
                    [user.id.toString(), user.username, user.email, password],
                    () => console.log("Local sync successful"),
                    (err) => console.error("Local Sync Error", err)
                );
            });

            await AsyncStorage.setItem('currentUserId', user.id.toString());
            await AsyncStorage.setItem('currentUsername', user.username);
            
            WebSocketService.connect(); 

            Alert.alert("Welcome!", `Hi ${user.username}`);
            navigation.navigate('Home');
        } else {
            Alert.alert("Login Failed", result.error || "Invalid credentials");
        }
        } catch (error) {
            console.log("Cloud unreachable, attempting local login...");
            db.transaction((tx) => {
                tx.executeSql(
                    'SELECT * FROM students WHERE email = ? AND password = ?',
                    [email, password],
                    (_, results) => {
                        if (results.rows.length > 0) {
                            const localUser = results.rows.item(0);
                            AsyncStorage.setItem('currentUserId', localUser.id.toString());
                            AsyncStorage.setItem('currentUsername', localUser.username);
                            
                            Alert.alert("Offline Mode", `Logged in locally as ${localUser.username}`);
                            navigation.navigate('Home');
                        } else {
                            Alert.alert("Error", "Cloud unreachable and no local account found.");
                        }
                    }
                );
            });
        }
    };

    return (
        <View style={[styles.container, styles.loginPageBG]}>
            <View style={styles.container}>
                <Image
                    source={require('../../icons/AppLogo.png')}
                    style={styles.logo}></Image>
                <Text style={styles.loginPageText}>
                    Login Page
                </Text>
                <TextInput
                    style={styles.inputTextBox}
                    placeholder='example@1utar.my'
                    value={email}
                    onChangeText={(input) => setEmail(input)}>
                </TextInput>
                <View style={styles.passwordTextBox}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder='Password'
                        value={password}
                        onChangeText={(input) => setPassword(input)}
                        secureTextEntry={!isPasswordVisible}>
                    </TextInput>
                    {password.length > 0 && (
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
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                >
                    <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
                <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('ForgotPassword')}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={{ marginTop: 10 }} 
                        onPress={() => navigation.navigate('SignUp')}>
                        <Text style={styles.forgotPasswordText}>New User?</Text>
                    </TouchableOpacity>

                     <TouchableOpacity 
                        style={{ marginTop: 10}}
                        onPress={() => navigation.navigate('Admin')}>
                        <Text style={styles.forgotPasswordText}>Admin?</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

export default App;