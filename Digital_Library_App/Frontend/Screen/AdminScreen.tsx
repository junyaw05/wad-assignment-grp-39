import React from 'react';
import { Text, View, Image, TextInput, TouchableOpacity, Alert, FlatList, ToastAndroid} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { styles } from '../SharedStyles';
import {RootStackParamList} from '../App';
import { socket } from '../services/WebSocketService';


export type Props = StackScreenProps<RootStackParamList, 'Admin'>;

const AdminScreen = ({ route, navigation }: Props) => {

    return (
        <View style={styles.mainContainer}>
            <View style={styles.AdminContainer}>
                <Text style={styles.header}>Welcome Back, Admin!</Text>
                <TouchableOpacity style={styles.AdminMainButton} onPress={() => navigation.navigate('ManageStudent')}>
                    <Image source={require('../../icons/student.png')} style={styles.AdminMainButtonImage} />
                    <Text style={styles.AdminMainButtonText}>Manage Students</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.AdminMainButton, styles.AdminMainButton2]} onPress={() => navigation.navigate('ManageBook')}>
                    <Image source={require('../../icons/book.png')} style={styles.AdminMainButtonImage} />
                    <Text style={styles.AdminMainButtonText}>Manage Books</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.AdminMainButton, styles.AdminMainButton3]} onPress={() => navigation.navigate('ReportGeneration')}>
                    <Image source={require('../../icons/report.png')} style={styles.AdminMainButtonImage} />
                    <Text style={styles.AdminMainButtonText}>Generate Reports</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.adminFooter}>
                <TouchableOpacity style={styles.adminLogoutButton} onPress={() => {
                    Alert.alert('Confirm Logout?', 'Admin', [
                        {
                        text: 'Yes',
                        onPress: () => {
                            (navigation as any).navigate('Login')
                            ToastAndroid.show('Logout Successful', ToastAndroid.LONG);
                        },
                        },
                        {text: 'No', onPress: () => {}},
                    ]);
                }}>
                    <Text style={[styles.adminLogoutButtonText]}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default AdminScreen;