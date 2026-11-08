import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, 
  TouchableOpacity, ScrollView, Alert, StatusBar, Platform, 
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dropdown } from 'react-native-element-dropdown'; 
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'; 

// Import Firebase
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FONTS } from '../theme/fonts';

// --- 👇 1. Import Gemini ---
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- ⛔️ 2. ใส่ API KEY ของคุณที่นี่ (!!! นี่คือส่วนที่อันตราย !!!) ---
const API_KEY = "AIzaSyC56JldpaNkzAUAPTwaJgMFNrozOJocg34"; 

// --- 3. ตั้งค่า Gemini ---
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// --- ข้อมูลสำหรับ Dropdown (เหมือนเดิม) ---
const mealData = [
  { label: 'มื้อเช้า', value: 'มื้อเช้า', icon: () => <MaterialCommunityIcons name="coffee" size={20} color="black" /> },
  { label: 'มื้อเที่ยง', value: 'มื้อเที่ยง', icon: () => <Ionicons name="fast-food" size={20} color="black" /> },
  { label: 'มื้อเย็น', value: 'มื้อเย็น', icon: () => <FontAwesome5 name="wine-glass-alt" size={20} color="black" /> },
];

export default function AddScreen({ navigation }) {
  // --- States สำหรับฟอร์ม ---
  const [mealType, setMealType] = useState(null); 
  const [foodName, setFoodName] = useState(''); 
  const [ingredients, setIngredients] = useState(['']); 
  
  const [isFocus, setIsFocus] = useState(false); 
  const [isSaving, setIsSaving] = useState(false); // 👈 State ใหม่สำหรับตอนกด Save

  // --- ฟังก์ชันสำหรับจัดการช่องวัตถุดิบ (เหมือนเดิม) ---
  const handleIngredientChange = (text, index) => {
    const newIngredients = [...ingredients]; 
    newIngredients[index] = text; 
    setIngredients(newIngredients); 
  };
  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']); 
  };
  const handleRemoveIngredient = (index) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1); 
    setIngredients(newIngredients);
  };

  // --- 4. ฟังก์ชันสำหรับปุ่มหลัก (แก้ไขใหม่ทั้งหมด) ---

  const handleSave = async () => {
    // ตรวจสอบข้อมูล
    if (!mealType || !foodName || ingredients.some(item => item === '')) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'ไม่พบข้อมูลผู้ใช้');
      return;
    }

    // --- เริ่มการบันทึก (แสดง Loading) ---
    setIsSaving(true); 

    try {
      // --- 5. เรียก Gemini API โดยตรง ---
      console.log('Calling Gemini API...');
      const ingredientsString = ingredients.join(", ");
      const prompt = `
        Calculate the estimated calories for the following meal:
        - Meal Name: ${foodName}
        - Ingredients: ${ingredientsString}
        
        Please provide only the estimated total calorie number.
        Do not add "kcal", units, or any other text. Just the number.
        Example: 550
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      const calories = parseInt(text, 10);

      if (isNaN(calories)) {
        // ถ้า Gemini ตอบมาไม่เป็นตัวเลข
        throw new Error(`Gemini response was not a number: ${text}`);
      }
      
      console.log(`Gemini response: ${calories} kcal`);

      // --- 6. เตรียมข้อมูลที่จะบันทึกลง Firestore (พร้อมแคลอรี) ---
      const mealDoc = {
        userId: user.uid,
        mealType: mealType,
        foodName: foodName,
        ingredients: ingredients,
        createdAt: serverTimestamp(),
        
        calories: calories,       // 👈 ใส่ค่าแคลอรีที่ได้มา
        status: 'completed',    // 👈 ตั้งสถานะว่าสำเร็จ
        errorMessage: null,
      };

      // --- 7. บันทึกข้อมูลลง collection 'meals' ---
      const docRef = await addDoc(collection(db, 'meals'), mealDoc);
      
      console.log('Meal saved with ID:', docRef.id);
      Alert.alert('บันทึกสำเร็จ', `${foodName} ถูกบันทึกแล้ว (${calories} kcal)`);

      clearForm();
      navigation.goBack();

    } catch (e) {
      console.error('Error saving or calling API: ', e);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกหรือคำนวณแคลอรีได้: ' + e.message);
    } finally {
      // --- หยุด Loading ไม่ว่าสำเร็จหรือล้มเหลว ---
      setIsSaving(false); 
    }
  };

  // ฟังก์ชันเคลียร์ฟอร์ม (เหมือนเดิม)
  const clearForm = () => {
    setMealType(null);
    setFoodName('');
    setIngredients(['']);
  };

  // เมื่อกดปุ่ม Cancel (เหมือนเดิม)
  const handleCancel = () => {
    if (isSaving) return; // ถ้ากำลัง Save อยู่ กด Cancel ไม่ได้
    clearForm();
    navigation.goBack() 
  };


  // --- 8. ส่วนแสดงผล (JSX) ---
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.headerTitle}>Add Meal</Text>

        {/* --- Card 1: มื้อ (เหมือนเดิม) --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>มื้อ</Text>
          <Dropdown
            style={[styles.dropdown, isFocus && { borderColor: '#1ed760' }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={mealData} 
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!isFocus ? 'เลือกมื้ออาหาร' : '...'}
            value={mealType} 
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            onChange={item => {
              setMealType(item.value); 
              setIsFocus(false);
            }}
            renderLeftIcon={item => { 
              return item?.icon ? item.icon() : null;
            }}
            // 👈 ปิดการใช้งาน Dropdown ขณะกำลัง Save
            disable={isSaving} 
          />
        </View>

        {/* --- Card 2: ชื่ออาหาร (แก้ไขเล็กน้อย) --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ชื่ออาหาร</Text>
          <TextInput
            style={styles.textInput}
            placeholder="เช่น ข้าวกะเพราไก่"
            value={foodName}
            onChangeText={setFoodName}
            // 👈 ปิดการใช้งานขณะกำลัง Save
            editable={!isSaving} 
          />
        </View>

        {/* --- Card 3: วัตถุดิบ (แก้ไขเล็กน้อย) --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>วัตถุดิบ</Text>
          {ingredients.map((item, index) => (
            <View key={index} style={styles.ingredientRow}>
              <TextInput
                style={styles.textInput}
                placeholder={`วัตถุดิบ ${index + 1}`}
                value={item}
                onChangeText={(text) => handleIngredientChange(text, index)}
                // 👈 ปิดการใช้งานขณะกำลัง Save
                editable={!isSaving} 
              />
              
              {ingredients.length > 1 && !isSaving && ( // 👈 ซ่อนปุ่ม X
                <TouchableOpacity onPress={() => handleRemoveIngredient(index)} style={styles.iconButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              )}

              {index === ingredients.length - 1 && !isSaving && ( // 👈 ซ่อนปุ่ม +
                <TouchableOpacity onPress={handleAddIngredient} style={styles.iconButton}>
                  <Ionicons name="add-circle" size={28} color="#FAB95B" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* --- ปุ่ม Save / Cancel (แก้ไขเล็กน้อย) --- */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancel}
            // 👈 ปิดการใช้งานขณะกำลัง Save
            disabled={isSaving} 
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} // 👈 เปลี่ยนสีปุ่มตอน Save
            onPress={handleSave}
            // 👈 ปิดการใช้งานขณะกำลัง Save
            disabled={isSaving} 
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" /> // 👈 แสดงตัวหมุน
            ) : (
              <Text style={styles.saveButtonText}>Save</Text> // 👈 แสดงข้อความปกติ
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- Stylesheet (แก้ไขเล็กน้อย) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E2DB', // สีพื้นหลังและกลาง E8E2DB
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100, 
  },
  headerTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 28,
    color: '#1A3263', // สีหลัก 1A3263
    marginBottom: 20,
    paddingTop: (Platform.OS === 'android' ? StatusBar.currentHeight : 0),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    fontFamily: FONTS.regular,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    width: '100%',
    flex: 1, 
  },
  dropdown: {
    height: 55,
    borderColor: '#f0f0f0',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  placeholderStyle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: '#999',
  },
  selectedTextStyle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    marginLeft: 10, 
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconButton: {
    marginLeft: 10,
    padding: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1, 
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  cancelButtonText: {
    fontFamily: FONTS.semiBold,
    color: '#888',
    fontSize: 16,
  },
  saveButton: {
    flex: 1, 
    backgroundColor: '#1A3263', // สีหลัก 1A3263
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  // 👈 Style ใหม่สำหรับปุ่ม Save ตอน Loading
  saveButtonDisabled: {
    backgroundColor: '#999', // สีเทา
  },
  saveButtonText: {
    fontFamily: FONTS.semiBold,
    color: '#fff',
    fontSize: 16,
  },
});