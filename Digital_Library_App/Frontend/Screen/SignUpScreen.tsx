import React, { useState } from 'react';
import { Text, View, Image, TextInput, TouchableOpacity, Alert} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { styles } from '../SharedStyles'

import {RootStackParamList} from '../App'
import SQLite from 'react-native-sqlite-storage';
import * as WebSocketService from '../services/WebSocketService';
import {db} from '../services/database';

export type Props = StackScreenProps<RootStackParamList, 'SignUp'>;

const App = ({route, navigation}: Props) => {
    const [errorMessage, setErrorMessage] = useState('');
    const [signUpSuccessMessage, setSignUpSuccessMessage] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const isEmailValid = email && email.length >= 15 && email.includes('@1utar.my');
    const isUsernameValid = username && username.length > 5 && /[ !@#$%^&*(),.?":{}|<>]/.test(username) === false;

    const criteria = [
        { label: 'At least 8 characters', valid: password.length >= 8 },
        { label: 'At least one uppercase letter', valid: /[A-Z]/.test(password) },
        { label: 'At least one number', valid: /[0-9]/.test(password) },
        { label: 'At least one special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
    
    const allValid = criteria.every(item => item.valid);

    const dropStudentsTable = () => {
    db.transaction((tx) => {
        tx.executeSql(
            'DROP TABLE IF EXISTS students',
            [],
            () => {
                console.log('Local "students" table dropped successfully.');
                Alert.alert("Success", "Table dropped. Restart the app to recreate it.");
            },
            (err) => {
                console.error('Error dropping table:', err);
                Alert.alert("Error", "Could not drop the table.");
            }
        );
    });
    };
    const hardResetDatabase = () => {
    Alert.alert(
        "Nuclear Reset",
        "This will delete all local data. Are you sure?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete Everything", 
                onPress: () => {
                    SQLite.deleteDatabase(
                        { name: 'library.sqlite', location: 'default' },
                        () => { 
                            console.log('Local database file deleted.');
                            Alert.alert("Success", "Database deleted. Please close and restart the app to rebuild it.");
                        },
                        (error) => { 
                            console.error("Delete error: ", error); 
                            Alert.alert("Error", "Could not delete database.");
                        }
                    );
                },
                style: "destructive"
            }
        ]
    );
};
    const handleSignUp = async() => {
        if (!isEmailValid) {
            Alert.alert("Invalid Email", "Must be @1utar.my and at least 6 characters.");
            return;
        }
        if (!isUsernameValid) {
            Alert.alert("Invalid Username", "Must be at least 6 characters, no space and contain no special characters.");
            return;
        }
        if (!allValid) {
            Alert.alert("Invalid Password", "Password does not meet all criteria.");
            return;
        }
        
        try {
        console.log("Attempting to connect to Cloud Server...");
        
        const studentData = {
            username: username,
            email: email,
            password: password
        };

        const result = await WebSocketService.createStudentHTTP(studentData);

        if (result && result.id) {
            console.log("Cloud Success: Account ID", result.id);
            Alert.alert("Success", `Account created on Cloud! ID: ${result.id}`);
            navigation.navigate('Login');
        } else {
            console.warn("Cloud Failed:", result?.error || "Unknown server error");
            Alert.alert("Sign Up Failed", result?.error || "Could not create account.");
        }
        } catch (error) {
            console.error("Connection Error:", error);
            Alert.alert("Error", "Could not connect to the server. Please check if your Node.js backend is running.");
        }
        
    };

return (
        <View style={[styles.container, styles.loginPageBG]}>
            <View style={styles.container}>
                <Image
                    source={require('../../icons/AppLogo.png')}
                    style={styles.logo}></Image>
                <Text style={styles.loginPageText}>
                    Sign Up Page
                </Text>
                <TextInput
                    style={styles.inputTextBox}
                    placeholder='example@1utar.my'
                    value={email}
                    onChangeText={(input) => setEmail(input)}>
                </TextInput>
                 <TextInput
                    style={styles.inputTextBox}
                    placeholder='Username'
                    value={username}
                    onChangeText={(input) => setUsername(input)}>
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

                {!allValid && (
                    <View style={styles.criteriaContainer}>
                        {criteria.map((item, index) => (
                            <Text 
                                key={index} 
                                style={[
                                    styles.criteriaText, 
                                    password.length > 0 
                                        ? (item.valid ? styles.criteriaValid : styles.criteriaInvalid) 
                                        : { color: '#718096' }
                                ]}
                            >
                                {item.valid ? '✓' : 'x'} {item.label}
                            </Text>
                        ))}
                    </View>
                )}

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleSignUp}
                >
                    <Text style={styles.loginButtonText}>Sign Up</Text>
                </TouchableOpacity>

                <View>
                    <TouchableOpacity 
                        style={{ marginTop: 20 }}
                        onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.forgotPasswordText}>Already have an account? Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default App;