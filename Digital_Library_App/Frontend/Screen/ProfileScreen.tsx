import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Image, TouchableOpacity, Alert } from 'react-native';
import { styles } from '../SharedStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootDrawerParams } from '../App';
import { DrawerScreenProps } from '@react-navigation/drawer';

export type Props = DrawerScreenProps<RootDrawerParams, 'DrawerProfile'>;

const ProfileScreen = ({ navigation }: Props) => {
    const [user,setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const BASE_URL = "http://10.0.2.2:5000/api/members";

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const savedId = await AsyncStorage.getItem('currentUserId');
            if (!savedId) return;
            const response = await fetch(`${BASE_URL}/${savedId}`); 
            const data = await response.json();
            
            if (data) {
                setUser(data);
            } else {
                Alert.alert("Error", "User not found");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    const renderAvatar = ()=>{
        return user?.username 
        ? user.username.substring(0, 3).toUpperCase() 
        : "USR";
    }

    return (
        <View style={[styles.settingcontainer, {alignItems: 'center'}]}>
            {/* Profile Information Card */}
            <View style={{ 
                width: 120, 
                height: 120, 
                borderRadius: 60, 
                backgroundColor: '#0145ffff',
                justifyContent: 'center', 
                alignItems: 'center',
                marginBottom: 50,
                marginTop: 30
            }}>
                <Text style={{ 
                    color: 'white', 
                    fontSize: 38,
                    fontWeight: 'bold',
                    letterSpacing: 1 
                }}>
                    {renderAvatar()}
                </Text>
            </View>
                
            {/* Username Display */}
            <View style={{ width: '100%', paddingHorizontal: 15, marginBottom: 20 }}>
                <Text style={{ color: 'gray', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>USERNAME</Text>
                <Text style={{ color: 'black', fontSize: 18, marginTop: 4 }}>{user?.username}</Text>
            </View>

            {/* Email Display */}
            <View style={{ width: '100%', paddingHorizontal: 15, marginBottom: 15 }}>
                <Text style={{ color: 'gray', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>EMAIL ADDRESS</Text>
                <Text style={{ color: 'black', fontSize: 18, marginTop: 4 }}>{user?.email}</Text>
            </View>

            {/* Logout Action */}
            <TouchableOpacity 
                style={[styles.optionCard, styles.logoutOptionCard, { marginTop: 70 }]} 
                onPress={() => {
                    Alert.alert("Logout", "Are you sure you want to exit?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Logout", onPress: () => (navigation as any).navigate('Login') }
                    ]);
                }}>
                <View style={{alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={styles.optionLogoutText}>Logout</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default ProfileScreen;