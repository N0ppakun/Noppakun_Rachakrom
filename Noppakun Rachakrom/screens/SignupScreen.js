import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar,
  ScrollView, ImageBackground, Image, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dropdown } from 'react-native-element-dropdown';

// Import Firebase (Auth และ DB)
import { auth, db } from '../firebaseConfig.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../theme/fonts';

export default function SignupScreen({ navigation }) {
  // States สำหรับฟอร์ม
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('ชาย'); // เพิ่มเพศค่าเริ่มต้น ชาย
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('sedentary'); // เพิ่มระดับกิจกรรมค่าเริ่มต้น
  const [calculatedBmr, setCalculatedBmr] = useState(0);
  const [calculatedTdee, setCalculatedTdee] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false); // State สำหรับเปิด/ปิด Pop-up

  const genderData = [
    { label: 'ชาย', value: 'ชาย' },
    { label: 'หญิง', value: 'หญิง' }
  ];

  const activityData = [
    { label: 'นั่งทำงานอยู่กับที่ / ไม่ค่อยออกกำลังกาย', value: 'sedentary', factor: 1.2 },
    { label: 'ออกกำลังกายเบาๆ (1-3 วัน/สัปดาห์)', value: 'light', factor: 1.375 },
    { label: 'ออกกำลังกายปานกลาง (3-5 วัน/สัปดาห์)', value: 'moderate', factor: 1.55 },
    { label: 'ออกกำลังกายหนัก (6-7 วัน/สัปดาห์)', value: 'active', factor: 1.725 },
    { label: 'ออกกำลังกายหนักมาก / งานกรรมกร', value: 'extra', factor: 1.9 }
  ];

  // ฟังก์ชันสร้างบัญชี
  const handleCreateAccount = async () => {
    setError('');
    // ตรวจสอบว่ากรอกครบทุกช่อง
    if (!email || !password || !confirmPassword || !name || !gender || !age || !weight || !height || !activityLevel) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (isNaN(ageNum) || isNaN(weightNum) || isNaN(heightNum)) {
      setError('กรุณากรอกอายุ น้ำหนัก และส่วนสูงเป็นตัวเลข');
      return;
    }

    // คำนวณ BMR
    let bmr = 0;
    if (gender === 'ชาย') {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
    } else {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
    }

    // คำนวณ TDEE
    const selectedActivity = activityData.find(item => item.value === activityLevel);
    const factor = selectedActivity ? selectedActivity.factor : 1.2;
    const tdee = bmr * factor;

    const finalBmr = Math.round(bmr);
    const finalTdee = Math.round(tdee);

    global.isSigningUp = true; // บล็อก App.js ไม่ให้ redirect ขณะแสดง Modal

    try {
      // 1. สร้างผู้ใช้ใน Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('Account Created! User UID:', user.uid);

      // 2. บันทึกข้อมูลส่วนตัวลงใน Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: email.toLowerCase(),
        name: name,
        gender: gender, // บันทึกเพศ
        age: ageNum,
        weight: weightNum,
        height: heightNum,
        activityLevel: activityLevel,
        bmr: finalBmr,
        tdee: finalTdee
      });

      console.log('User data saved to Firestore!');

      // 3. ตั้งค่าแสดงผลใน Pop-up
      setCalculatedBmr(finalBmr);
      setCalculatedTdee(finalTdee);

      // 4. แสดง Pop-up สำเร็จ
      setShowSuccessModal(true);

    } catch (err) {
      global.isSigningUp = false; // ปิด flag หากเกิดข้อผิดพลาด
      if (err.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกใช้งานแล้ว');
      } else if (err.code === 'auth/weak-password') {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      } else {
        setError('เกิดข้อผิดพลาด: ' + err.message);
      }
      console.error(err.code, err.message);
    }
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
                  <TouchableOpacity
                    style={styles.toggleBtn}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Text style={styles.toggleText}>เข้าสู่ระบบ</Text>
                  </TouchableOpacity>
                  <View style={[styles.toggleBtn, styles.toggleBtnActive]}>
                    <Text style={styles.toggleTextActive}>ลงทะเบียน</Text>
                  </View>
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

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ยืนยันรหัสผ่าน</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.inputPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                      <Ionicons
                        name={showConfirmPassword ? 'eye' : 'eye-off'}
                        size={22}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ชื่อ</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="กรอกชื่อของคุณ"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* แบ่งครึ่ง เพศ / อายุ */}
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>เพศ</Text>
                    <Dropdown
                      style={styles.dropdown}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      iconStyle={styles.iconStyle}
                      data={genderData}
                      maxHeight={200}
                      labelField="label"
                      valueField="value"
                      placeholder="เลือกเพศ"
                      value={gender}
                      onChange={item => {
                        setGender(item.value);
                      }}
                      renderRightIcon={() => (
                        <Ionicons name="chevron-down" size={20} color="#333" />
                      )}
                    />
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>อายุ</Text>
                    <TextInput
                      style={styles.input}
                      value={age}
                      onChangeText={setAge}
                      keyboardType="numeric"
                      placeholder="ปี"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                {/* แบ่งครึ่ง น้ำหนัก / ส่วนสูง */}
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>น้ำหนัก</Text>
                    <TextInput
                      style={styles.input}
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="numeric"
                      placeholder="กก."
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>ส่วนสูง</Text>
                    <TextInput
                      style={styles.input}
                      value={height}
                      onChangeText={setHeight}
                      keyboardType="numeric"
                      placeholder="ซม."
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                {/* ระดับกิจกรรม */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ระดับกิจกรรม</Text>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    iconStyle={styles.iconStyle}
                    data={activityData}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="เลือกระดับกิจกรรม"
                    value={activityLevel}
                    onChange={item => {
                      setActivityLevel(item.value);
                    }}
                    renderRightIcon={() => (
                      <Ionicons name="chevron-down" size={20} color="#333" />
                    )}
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* ปุ่มสมัครสมาชิก */}
                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateAccount}>
                  <Text style={styles.submitBtnText}>ลงทะเบียน</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>

      {/* Pop-up แสดงความยินดีหลังสมัครเสร็จ */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            {/* ไอคอนถูกสีเขียว */}
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={36} color="#ffffff" />
            </View>

            <Text style={styles.modalText}>ลงทะเบียนสำเร็จ</Text>

            <View style={styles.modalResultContainer}>
              <Text style={styles.modalResultTitle}>พลังงานที่ร่างกายต้องการต่อวัน</Text>

              <View style={styles.modalResultRow}>
                <Text style={styles.modalResultLabel}>BMR (อัตราการเผาผลาญพื้นฐาน):</Text>
                <Text style={styles.modalResultValue}>{calculatedBmr} kcal</Text>
              </View>

              <View style={styles.modalResultRow}>
                <Text style={styles.modalResultLabel}>TDEE (พลังงานที่ต้องการทั้งหมด):</Text>
                <Text style={styles.modalResultValue}>{calculatedTdee} kcal</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                global.isSigningUp = false;
                // บอก App.js ให้ apply user ที่ค้างอยู่ → redirect ไป MainApp
                if (global.applyPendingUser && global.pendingAuthUser !== undefined) {
                  global.applyPendingUser(global.pendingAuthUser);
                  global.pendingAuthUser = undefined;
                }
              }}
            >
              <Text style={styles.modalButtonText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: 'rgba(232, 226, 219, 0.75)',
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
    marginBottom: -45,
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
    paddingTop: 65,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  column: {
    width: '48%',
  },
  dropdown: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    justifyContent: 'center',
    width: '100%',
  },
  selectedTextStyle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: '#333',
  },
  placeholderStyle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: '#999',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  errorText: {
    fontFamily: FONTS.regular,
    color: '#e53e3e',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: '#547792',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#547792',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  modalText: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: '#1A3263',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalResultContainer: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalResultTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalResultRow: {
    marginBottom: 12,
    alignItems: 'center',
  },
  modalResultLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 2,
  },
  modalResultValue: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: '#2B6CB0',
    textAlign: 'center',
  },
  modalButton: {
    borderWidth: 1.5,
    borderColor: '#333333',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 35,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: '#333333',
  },
});
