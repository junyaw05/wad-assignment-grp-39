import React, { useState } from 'react';
import { 
    Text, 
    View, 
    Image, 
    TextInput, 
    TouchableOpacity, 
    Alert 
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { styles } from '../SharedStyles';
import { RootStackParamList } from '../App';

import * as WebSocketService from '../services/WebSocketService';
import { db } from '../services/database';

export type Props = StackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = ({ navigation }: Props) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    // Criteria for Password Strength Validation
    const criteria = [
        { label: 'At least 8 characters', valid: password.length >= 8 },
        { label: 'At least one uppercase letter', valid: /[A-Z]/.test(password) },
        { label: 'At least one number', valid: /[0-9]/.test(password) },
        { label: 'At least one special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    const allValid = criteria.every(item => item.valid);

    const handlePasswordReset = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert("Input Required", "Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match.");
            return;
        }

        if (!allValid) {
            Alert.alert("Error", "Password does not meet the security criteria.");
            return;
        }

        try {
        const response = await fetch('http://10.0.2.2:5000/api/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok) {
            
            db.transaction((tx) => {
                tx.executeSql(
                    'UPDATE students SET password = ? WHERE email = ?',
                    [password, email],
                    () => console.log("Local password updated"),
                    (err) => console.error("Local Update Error", err)
                );
            });
            

            Alert.alert("Success", "Password updated successfully in the Cloud!");
            navigation.navigate('Login');
        } else {
            Alert.alert("Update Failed", result.error);
        }
    } catch (error) {
        Alert.alert("Network Error", "Unable to connect to the server. Check your internet.");
    }
};
    return (
        <View style={[styles.container, styles.loginPageBG]}>
            <View style={styles.container}>
                <Image
                    source={require('../../icons/AppLogo.png')}
                    style={styles.logo}
                />
                
                <Text style={styles.loginPageText}>Reset Password</Text>

                <TextInput
                    style={styles.inputTextBox}
                    placeholder="example@1utar.my"
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={(input) => setEmail(input)}
                />

                {/* New Password Input */}
                <View style={styles.passwordTextBox}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="New Password"
                        value={password}
                        onChangeText={(input) => setPassword(input)}
                        secureTextEntry={!isPasswordVisible}
                    />
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

                {/* Criteria List*/}
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

                {/* Confirm Password Input - Only visible if criteria are met */}
                {allValid && (
                    <View style={styles.passwordTextBox}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChangeText={(input) => setConfirmPassword(input)}
                            secureTextEntry={!isConfirmPasswordVisible}
                        />
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                        >
                            <Image
                                source={isConfirmPasswordVisible 
                                    ? require('../../icons/view.png') 
                                    : require('../../icons/hide.png')
                                }
                                style={{ width: 24, height: 24 }}
                            />
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.loginButton, { marginTop: 20 }]}
                    onPress={handlePasswordReset}
                >
                    <Text style={styles.loginButtonText}>Update Password</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={{ marginTop: 25 }}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.forgotPasswordText}>Back to Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default ForgotPasswordScreen;