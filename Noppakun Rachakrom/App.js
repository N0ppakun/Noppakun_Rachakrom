import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import {
  useFonts,
  Prompt_400Regular,
  Prompt_500Medium,
  Prompt_600SemiBold,
  Prompt_700Bold
} from '@expo-google-fonts/prompt';
import {
  Kanit_400Regular,
  Kanit_500Medium,
  Kanit_600SemiBold,
  Kanit_700Bold
} from '@expo-google-fonts/kanit';
import { FONTS } from './theme/fonts';

// --- Import หน้าจอทั้งหมด ---
import FPang from './screens/FPang'; // 👈 หน้า Welcome ที่คุณสร้างใหม่
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';

import ScanScreen from './screens/ScanScreen';
import FoodScreen from './screens/FoodScreen';
import AddScreen from './screens/AddScreen';
import SettingScreen from './screens/SettingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- ส่วนของ Tab Navigation (หลังจาก Login แล้ว) ---
function MainAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1A3263', // สีหลัก
        tabBarInactiveTintColor: '#547792', // สีรอง
        tabBarLabelStyle: {
          fontFamily: FONTS.medium,
          fontSize: 12,
          marginBottom: 8,
        },
        tabBarStyle: {
          paddingTop: 10,
          paddingBottom: Platform.OS === 'android' ? 28 : 20,
          height: Platform.OS === 'android' ? 105 : 95,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
      })}
    >
      <Tab.Screen
        name="Food"
        component={FoodScreen}
        options={{
          tabBarLabel: 'รายชื่ออาหาร',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: 'ถ่ายรูป',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="camera-iris" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Setting"
        component={SettingScreen}
        options={{
          tabBarLabel: 'โปรไฟล์',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// --- Component หลักของ App ---
export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  const [fontsLoaded] = useFonts({
    Prompt_400Regular,
    Prompt_500Medium,
    Prompt_600SemiBold,
    Prompt_700Bold,
    Kanit_400Regular,
    Kanit_500Medium,
    Kanit_600SemiBold,
    Kanit_700Bold,
  });

  // ตรวจสอบสถานะการเข้าสู่ระบบ
  useEffect(() => {
    // เปิดช่องทางให้ SignupScreen เรียก setUser ได้โดยตรงหลังปิด Modal
    global.applyPendingUser = (pendingUser) => {
      setUser(pendingUser);
      if (initializing) setInitializing(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (global.isSigningUp) {
        // เก็บ user ไว้รอ ไม่ redirect ตอนนี้
        global.pendingAuthUser = authUser;
        console.log('Signup in progress — auth state saved for later');
        return;
      }
      setUser(authUser);
      if (initializing) {
        setInitializing(false);
      }
    });

    return () => {
      unsubscribe();
      global.applyPendingUser = null;
    };
  }, []);

  if (initializing || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAF9' }}>
        <ActivityIndicator size="large" color="#1A3263" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // --- 🟢 กรณีที่ Login แล้ว ---
          <>
            <Stack.Screen name="MainApp" component={MainAppTabs} />
            <Stack.Screen
              name="AddScreen"
              component={AddScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          // --- 🔴 กรณีที่ยังไม่ได้ Login ---
          <>
            {/* หน้า FPang จะเป็นหน้าแรกสุดที่ผู้ใช้เห็น */}
            <Stack.Screen name="Welcome" component={FPang} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}