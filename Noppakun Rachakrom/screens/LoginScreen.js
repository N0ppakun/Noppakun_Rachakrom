import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar,
  ImageBackground, Image, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig.js';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../theme/fonts';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        console.log('Logged in user:', userCredential.user.email);
      })
      .catch(err => {
        if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
          setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } else {
          setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
        }
        console.error(err.code);
      });
  };

  return (
    <ImageBackground
      source={require('../assets/foq.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* ส่วนโลโก้ที่เหลื่อมขอบการ์ด */}
              <View style={styles.logoWrapper}>
                <View style={styles.circleBg}>
                  <Image
                    source={require('../assets/iconx.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>ยินดีต้อนรับ</Text>

                {/* ปุ่มสลับ Login / Sign up */}
                <View style={styles.toggleContainer}>
                  <View style={[styles.toggleBtn, styles.toggleBtnActive]}>
                    <Text style={styles.toggleTextActive}>เข้าสู่ระบบ</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.toggleBtn}
                    onPress={() => navigation.navigate('Signup')}
                  >
                    <Text style={styles.toggleText}>ลงทะเบียน</Text>
                  </TouchableOpacity>
                </View>

                {/* Form */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>อีเมล</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="กรอกอีเมลของคุณ"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>รหัสผ่าน</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.inputPassword}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      placeholder="กรอกรหัสผ่านของคุณ"
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Ionicons
                        name={showPassword ? 'eye' : 'eye-off'}
                        size={22}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* ปุ่ม Login */}
                <TouchableOpacity style={styles.submitBtn} onPress={handleLogin}>
                  <Text style={styles.submitBtnText}>เข้าสู่ระบบ</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(232, 226, 219, 0.75)', // โปร่งแสงสีเดียวกับธีมพื้นหลัง E8E2DB
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 50,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: -45, // ดึงการ์ดขึ้นมาทับส่วนล่างของโลโก้
    zIndex: 10,
    elevation: 10,
  },
  circleBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  logo: {
    width: 70,
    height: 70,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 65, // เผื่อพื้นที่ให้โลโก้ด้านบน
    paddingBottom: 30,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  cardTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 26,
    textAlign: 'center',
    color: '#1A3263',
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 30,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 26,
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#888',
  },
  toggleTextActive: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    fontFamily: FONTS.regular,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
    width: '100%',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    width: '100%',
  },
  inputPassword: {
    fontFamily: FONTS.regular,
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
  },
  eyeIcon: {
    paddingHorizontal: 14,
  },
  errorText: {
    fontFamily: FONTS.regular,
    color: '#e53e3e',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: '#1A3263',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#1A3263',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#ffffff',
    fontFamily: FONTS.semiBold,
    fontSize: 18,
  },
});