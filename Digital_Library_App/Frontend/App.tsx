import React, { useEffect, useState } from 'react';
import { Text, Image, View, TouchableOpacity, TouchableNativeFeedback,ToastAndroid,Alert} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {createDrawerNavigator,DrawerContentScrollView,DrawerItemList,} from '@react-navigation/drawer';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LoginScreen from './Screen/LoginScreen';
import SignUpScreen from './Screen/SignUpScreen';
import ForgotPasswordScreen from './Screen/ForgotPasswordScreen';
import HomeScreen from './Screen/HomeScreen';
import LibraryScreen from './Screen/LibraryScreen';
import SavedScreen from './Screen/SavedScreen';
import SettingsScreen from './Screen/SettingsScreen';
import ProfileScreen from './Screen/ProfileScreen';
import AdminScreen from './Screen/AdminScreen';
import ManageStudentScreen from './Screen/ManageStudentScreen';
import ManageBookScreen from './Screen/ManageBookScreen';
import ReportGenerationScreen from './Screen/ReportGenerationScreen';
import PDFReaderScreen from './Screen/PDFReaderScreen';
import WebViewReaderScreen from './Screen/WebViewReaderScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as WebSocketService from './services/WebSocketService';

import { setupDatabase } from './services/database';


export type RootStackParamList = {
    Login: undefined;
    SignUp: undefined;
    ForgotPassword: undefined;
    Home: undefined;
    Tab: undefined;
    Admin: undefined;
    CloudStatus: undefined;
    ManageStudent: undefined;
    ManageBook: undefined;
    ReportGeneration: undefined;
    PDFReader: { pdfUrl: string; title: string };
    WebViewReader: { url: string; title: string };
};

const Stack = createStackNavigator<RootStackParamList>();


export type RootTabParams = {
    Home: undefined;
    Library: undefined;
    Saved: undefined;
    Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParams>();

export type RootDrawerParams = {
  MainTabs: undefined;
  DrawerProfile: undefined;
};


const Drawer = createDrawerNavigator<RootDrawerParams>();

const CustomTabButton = (props: any) => {
    const { children, onPress, accessibilityState } = props;
    const focused = accessibilityState.selected;

    return (
        <TouchableOpacity
            activeOpacity={1.0}
            onPress={onPress}
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
            <View
                style={{
                    width: 60,
                    height: 50,
                    borderRadius: 20,
                    backgroundColor: focused ? '#ffffff30' : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 5,
                }}>
                {children}
            </View>
        </TouchableOpacity>
    );
};


const HomeTabs = () => {
    return (
        <Tab.Navigator screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: {
                height: 65,
                bottom: 10,
                left: 20,
                right: 20,
                borderRadius: 25,
                position: 'absolute',
                backgroundColor: 'rgb(202, 92, 245)',
                elevation: 10,
                borderTopWidth: 0,
            },
        }}>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarButton: (props) => <CustomTabButton {...props} />,
                    tabBarIcon: ({ focused }) => (
                        <Icon
                            name="home"
                            size={focused ? 30 : 25}
                            color={focused ? '#ffffff' : '#ffffff'}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Library"
                component={LibraryScreen}
                options={{
                    tabBarButton: (props) => <CustomTabButton {...props} />,
                    tabBarIcon: ({ focused }) => (
                        <Icon
                            name="import-contacts"
                            size={focused ? 30 : 25}
                            color={focused ? '#ffffff' : '#ffffff'}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Saved"
                component={SavedScreen}
                options={{
                    tabBarButton: (props) => <CustomTabButton {...props} />,
                    tabBarIcon: ({ focused }) => (
                        <Icon
                            name="bookmark"
                            size={focused ? 30 : 25}
                            color={focused ? '#ffffff' : '#ffffff'}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarButton: (props) => <CustomTabButton {...props} />,
                    tabBarIcon: ({ focused }) => (
                        <Icon
                            name="settings"
                            size={focused ? 30 : 25}
                            color={focused ? '#ffffff' : '#ffffff'}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};



const CustomDrawerComponent = (props:any) => {
    const [name, setName] = useState('User');
    const isFocused = useIsFocused();

    useEffect(() => {
        const loadName = async () => {
            const savedName = await AsyncStorage.getItem('currentUserName');
            if (savedName) setName(savedName);
        };

        if (isFocused) {
            loadName();
        }
    }, [isFocused]);
    const [userInfo, setUserInfo] = React.useState({ username: 'Guest', id: '' });
    useEffect(() => {
    const getUserData = async () => {
      try {
        const savedId = await AsyncStorage.getItem('currentUserId');
        const savedUsername = await AsyncStorage.getItem('currentUsername');
        
        if (savedId) {
          setUserInfo({
            username: savedUsername || 'Student User',
            id: savedId,
          });
        }
      } catch (e) {
        console.error("Failed to load user info", e);
      }
    };

    getUserData();
  }, []);

  return (
    <View style={{backgroundColor: 'white', flex: 1}}>
      <View
        style={{
          height: '20%',
          backgroundColor: '#b800ffff',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, marginTop: 10 }}>
            {name}
        </Text>
      </View>
      <DrawerContentScrollView>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <View style={{margin: 10}}>
        <TouchableNativeFeedback
          onPress={() => {
            Alert.alert('Confirm Logout?', `Are you sure you want to logout, ${name}?`, [
              {
                text: 'Yes',
                onPress: async() => {
                    try{
                        await AsyncStorage.multiRemove(['currentUserId', 'currentUsername']);
                        props.navigation.closeDrawer()
                        props.navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });

                  ToastAndroid.show('Logout Successful', ToastAndroid.LONG);
                    } catch (error){
                        console.error("Logout error:", error);
                    }
                },
              },
              {text: 'No', onPress: () => {}},
            ]);
          }}>
          <View
            style={{
              borderTopColor: 'black',
              height: 50,
              borderTopWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <FontAwesome5 style={{margin: 5, color:'red'}} name="door-open" />
            <Text style={{margin: 5, color: 'red'}}>LogOut</Text>
          </View>
        </TouchableNativeFeedback>
      </View>
    </View>
  );
};

const HomeDrawer = () => {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerComponent {...props} />}
            screenOptions={{
                headerShown: true,
                drawerStyle: {
                    width: 260,
                },
                headerStyle: {
                    backgroundColor: '#0145ffff',
                },
                headerTintColor: '#fff',
                headerTitleAlign: 'center',
            }}
        >
            <Drawer.Screen 
                name="MainTabs" 
                component={HomeTabs} 
                options={{ 
                    title: 'Digital Library App',
                    drawerIcon: ({ color, size }) => <Icon name="home" color={color} size={size} />
                }} 
            />
            <Drawer.Screen 
                name="DrawerProfile" 
                component={ProfileScreen} 
                options={{ 
                    title: 'My Profile',
                    drawerIcon: ({ color, size }) => <Icon name="person" color={color} size={size} />
                }} 
            />
        </Drawer.Navigator>
    );
};

const App = () => {

    useEffect(() => {
        setupDatabase(); 

        WebSocketService.connect();
        
        WebSocketService.setupSocketListeners({
            onNotification: (data: any) => {
                console.log("Global Alert:", data.message);
                ToastAndroid.show(data.message, ToastAndroid.SHORT);
            },
            onBooksReceived: (books: any) => {
                console.log("Real-time Book List Updated:", books.length);
            },
        });

        return () => {
            WebSocketService.disconnect();
        };
    }, []); 



    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen
                    name='Login'
                    component={LoginScreen}
                    options={{ headerShown: false }}>
                </Stack.Screen>


                <Stack.Screen
                    name='SignUp'
                    component={SignUpScreen}
                    options={{ headerShown: false }}>
                </Stack.Screen>

                <Stack.Screen
                    name='ForgotPassword'
                    component={ForgotPasswordScreen}
                    options={{ headerShown: false }}>
                </Stack.Screen>

                <Stack.Screen
                    name='Admin'
                    component={AdminScreen}
                    options={{ headerShown: false }}>
                </Stack.Screen>

                <Stack.Screen
                    name='Home'
                    component={HomeDrawer}
                    options={{ headerShown: false }}>
                </Stack.Screen>

                <Stack.Screen 
                    name="PDFReader" 
                    component={PDFReaderScreen} 
                    options={{ headerTitle: 'Reading Mode', headerShown: true }}>
                </Stack.Screen>

                <Stack.Screen 
                    name="WebViewReader" 
                    component={WebViewReaderScreen} 
                    options={{ headerTitle: 'Reading Mode', headerShown: true }}>
                </Stack.Screen>
                <Stack.Screen
                    name='Tab'
                    component={HomeTabs}
                    options={{ headerShown: false }}>
                </Stack.Screen>

                <Stack.Screen
                    name='ManageStudent'
                    component={ManageStudentScreen}
                    options={{...styles, title: 'Student Management Dashboard'}}>
                </Stack.Screen>

                <Stack.Screen
                    name='ManageBook'
                    component={ManageBookScreen}
                    options={{...styles, title: 'Book Management Dashboard'}}>
                </Stack.Screen>

                <Stack.Screen
                    name='ReportGeneration'
                    component={ReportGenerationScreen}
                    options={{...styles, title: 'Report Generation'}}>
                </Stack.Screen>

            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles: StackNavigationOptions = {
    headerTitleAlign: 'center',
    headerStyle: {
        backgroundColor: '#0145ffff',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
        fontWeight: 'bold',
    },
}

export default App;