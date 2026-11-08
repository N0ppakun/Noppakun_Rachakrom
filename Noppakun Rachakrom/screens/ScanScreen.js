import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Dimensions, ActivityIndicator, Alert, ScrollView, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
// นำเข้า Firebase (ตรวจสอบว่าไฟล์ firebaseConfig.js ของคุณถูกต้อง)
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../theme/fonts';

const { width } = Dimensions.get('window');

// URL สำหรับเชื่อมต่อ FastAPI
// - หากรันบน Render ให้ใช้ URL ของ Render เช่น: "https://your-render-app-name.onrender.com/predict"
// - หากรันบนเครื่องคอมพิวเตอร์ผ่าน IP: "http://172.27.102.227:8000/predict"
const API_URL = "https://noprx.onrender.com/predict";
// const API_URL = "https://your-render-app-name.onrender.com/predict"; // <-- ใส่ URL จาก Render ที่นี่เมื่อ Deploy เสร็จ

const ScanScreen = ({ navigation }) => {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nutritionData, setNutritionData] = useState(null);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  // State สำหรับเลือกมื้อและกรอกเวลาเอง
  const [selectedMeal, setSelectedMeal] = useState('มื้อเช้า');


  const mealOptions = [
    { label: 'มื้อเช้า', value: 'มื้อเช้า', color: '#FAB95B' },
    { label: 'มื้อเที่ยง', value: 'มื้อเที่ยง', color: '#FA9E5B' },
    { label: 'มื้อเย็น', value: 'มื้อเย็น', color: '#B19FFB' },
  ];

  // ตั้งค่ามื้ออาหารตามเวลาปัจจุบัน
  const initMeal = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setSelectedMeal('มื้อเช้า');
    else if (hour >= 11 && hour < 16) setSelectedMeal('มื้อเที่ยง');
    else setSelectedMeal('มื้อเย็น');
  };

  const takePhoto = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        setIsLoading(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
        });

        if (photo && photo.uri) {
          await analyzeImage(photo.uri);
        }
      } catch (e) {
        setIsLoading(false);
        Alert.alert("Error", "ไม่สามารถถ่ายภาพได้: " + e.message);
      }
    }
  };

  const analyzeImage = async (imageUri) => {
    try {
      const uploadResult = await uploadAsync(API_URL, imageUri, {
        httpMethod: 'POST',
        uploadType: FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType: 'image/jpeg',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (uploadResult.status !== 200) {
        throw new Error(`HTTP error! status: ${uploadResult.status}`);
      }

      const result = JSON.parse(uploadResult.body);

      if (result.predictions && result.predictions.length > 0) {
        // หาตัวทำนายที่มีค่าความแม่นยำสูงที่สุด
        const topPrediction = result.predictions.reduce((prev, current) =>
          (prev.confidence > current.confidence) ? prev : current
        );

        if (topPrediction && topPrediction.food_name_th) {
          setNutritionData({
            foodName: topPrediction.food_name_th,
            calories: topPrediction.calories,
            foodNameEn: topPrediction.food_name_en,
          });
          setIsLoading(false);
          initMeal();
          setModalVisible(true);
        } else {
          setIsLoading(false);
          Alert.alert("ไม่พบอาหาร", "ไม่พบข้อมูลโภชนาการสำหรับอาหารคลาสนี้");
        }
      } else {
        setIsLoading(false);
        Alert.alert("ไม่พบอาหาร", "ไม่สามารถระบุชนิดอาหารในรูปภาพได้ กรุณาลองใหม่อีกครั้ง");
      }

    } catch (error) {
      console.error("FastAPI Error:", error);
      setIsLoading(false);
      Alert.alert("API Error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หรือวิเคราะห์อาหารได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleAddData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบก่อน");
        return;
      }

      await addDoc(collection(db, "meals"), {
        userId: user.uid,
        mealType: selectedMeal,
        foodName: nutritionData?.foodName || "ระบุชื่อไม่ได้",
        calories: nutritionData?.calories || 0,
        ingredients: [],
        status: 'completed',
        errorMessage: null,
        createdAt: new Date(),
      });

      setModalVisible(false);
      Alert.alert("สำเร็จ", `บันทึกข้อมูลโภชนาการลงใน ${selectedMeal} เรียบร้อยแล้ว`);
      navigation.navigate('Food');
    } catch (e) {
      console.error("Error saving food:", e);
      Alert.alert("Error", "ไม่สามารถบันทึกข้อมูลได้");
    }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>ต้องการการเข้าถึงกล้องเพื่อถ่ายภาพอาหาร</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={{ color: 'white' }}>ขอสิทธิ์ใช้งานกล้อง</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.cameraWrapper}>
        {isFocused && (
          <CameraView
            style={styles.camera}
            facing="back"
            ref={cameraRef}
            onCameraReady={() => setIsCameraReady(true)}
          />
        )}
        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.scannerFrame} />
          <Text style={styles.scanText}>วางอาหารให้อยู่ในกรอบเพื่อถ่ายภาพ</Text>
        </View>

        <View style={styles.controls} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.shutterBtn}
            onPress={takePhoto}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <View style={styles.shutterInner}>
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Ionicons name="camera" size={30} color="#ffffff" />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ข้อมูลโภชนาการ</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={styles.foodNameTitle}>
                {nutritionData?.foodName || "ระบุชื่อไม่ได้"}
              </Text>
            </View>

            <View style={styles.nutritionRowMain}>
              <Text style={styles.mainLabel}>Calories</Text>
              <Text style={styles.mainValue}>{nutritionData?.calories} kcal</Text>
            </View>

            {/* --- เลือกมื้ออาหาร --- */}
            <Text style={styles.sectionLabel}>มื้ออาหาร</Text>
            <View style={styles.mealSelector}>
              {mealOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.mealChip,
                    selectedMeal === opt.value && { backgroundColor: opt.color, borderColor: opt.color }
                  ]}
                  onPress={() => setSelectedMeal(opt.value)}
                >
                  <Text style={[
                    styles.mealChipText,
                    selectedMeal === opt.value && { color: '#fff' }
                  ]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>



            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={handleAddData}>
                <Text style={styles.addBtnText}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  foodNameTitle: { fontFamily: FONTS.displayBold, fontSize: 28, color: '#FAB95B', textAlign: 'center' },
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cameraWrapper: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 20,
  },
  scanText: {
    fontFamily: FONTS.medium,
    color: 'white',
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FAB95B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: FONTS.bold, fontSize: 20, color: '#1A3263' },
  nutritionRowMain: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  mainLabel: { fontFamily: FONTS.medium, fontSize: 18, color: '#1A3263' },
  mainValue: { fontFamily: FONTS.bold, fontSize: 18, color: '#FAB95B' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 10 },
  nutritionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemLabel: { fontFamily: FONTS.regular, fontSize: 16, color: '#333' },
  itemValue: { fontFamily: FONTS.medium, fontSize: 16, color: '#1A3263' },
  sectionLabel: { fontFamily: FONTS.semiBold, fontSize: 14, color: '#555', marginTop: 14, marginBottom: 8 },
  mealSelector: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  mealChip: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#DDD',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  mealChipText: { fontFamily: FONTS.medium, fontSize: 13, color: '#444' },
  timeInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  timeInput: {
    width: 62, height: 48,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD',
    backgroundColor: '#F5F5F5',
    textAlign: 'center',
    fontFamily: FONTS.bold, fontSize: 20, color: '#1A3263',
  },
  timeSeparator: { fontFamily: FONTS.bold, fontSize: 22, color: '#1A3263' },
  timeUnit: { fontFamily: FONTS.medium, fontSize: 16, color: '#555', marginLeft: 4 },
  modalFooter: { flexDirection: 'row', marginTop: 20, gap: 15 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontFamily: FONTS.medium, fontSize: 16, color: '#555' },
  addBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#1A3263', justifyContent: 'center', alignItems: 'center' },
  addBtnText: { fontFamily: FONTS.semiBold, fontSize: 16, color: 'white' },
  primaryBtn: { backgroundColor: '#1A3263', padding: 15, borderRadius: 10 }
});

export default ScanScreen;