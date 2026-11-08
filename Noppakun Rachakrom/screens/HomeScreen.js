import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// เราจะใช้ไอคอนจาก @expo/vector-icons (ต้องติดตั้งเพิ่ม)
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper'; 
import { FONTS } from '../theme/fonts'; 

// --- 1. รับค่า width จาก Dimensions ---
const { width } = Dimensions.get('window');

// --- 2. ย้าย ImageSwiper ออกมาเป็น Component ของตัวเอง (นอก HomeScreen) ---
const ImageSwiper = () => {
  return (
    // ใช้ style 'swiperContainer' แทน 'container' ที่ซ้ำซ้อน
    <View style={styles.swiperContainer}>
      <Swiper
        autoplay        // เล่นอัตโนมัติ
        loop            // วนซ้ำเมื่อเลื่อนถึงภาพสุดท้าย
        showsPagination // แสดงจุดบอกตำแหน่ง
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
      >
        {/* ภาพที่ 1 */}
        <View style={styles.slide}>
          <Image
            source={require('../assets/gx01.jpg')}
            style={styles.image}
          />
          <Text style={styles.caption}>บัคแอปเปิล</Text>
        </View>
        {/* ภาพที่ 2 */}
        <View style={styles.slide}>
          <Image
            source={require('../assets/gx02.jpg')}
            style={styles.image}
          />
          <Text style={styles.caption}>เอากล้วยไปกิน</Text>
        </View>
      </Swiper>
    </View>
  );
};


// --- นี่คือ Component หลัก ---
export default function HomeScreen({ navigation }) {

  const handleScanPress = () => {
    // สั่งให้ Tab Navigator พาไปที่หน้า 'Scan'
    navigation.navigate('Scan'); 
  };

  const handleAddPress = () => {
    // สั่งให้ Stack Navigator เปิดหน้า 'AddScreen'
    navigation.navigate('AddScreen'); 
  };

  return (
    // SafeAreaView ป้องกันการชนขอบบน (Notch)
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* ตั้งค่าสีของตัวอักษร Status bar ด้านบน */}
      <StatusBar barStyle="dark-content" />
      
      {/* กรอบสำหรับปุ่มด้านบน */}
      <View style={styles.topButtonContainer}>
        
        {/* ปุ่ม Scan */}
        <TouchableOpacity style={styles.topButton} onPress={handleScanPress}>
          <Ionicons name="camera" size={30} color="white" />
          <Text style={styles.topButtonText}>Scan</Text>
        </TouchableOpacity>

        {/* ปุ่ม Add */}
        <TouchableOpacity style={styles.topButton} onPress={handleAddPress}>
          <Ionicons name="add" size={36} color="white" />
          <Text style={styles.topButtonText}>Add</Text>
        </TouchableOpacity>

      </View>

      {/* --- 3. เรียกใช้ ImageSwiper ที่นี่ --- */}
      <View style={styles.contentArea}>
         <ImageSwiper />
         {/* คุณสามารถเพิ่มเนื้อหาอื่นๆ ต่อด้านล่าง Swiper ได้ */}
      </View>

    </SafeAreaView>
  );
}

// --- 4. รวม StyleSheet ทั้งหมดไว้ที่เดียว และแก้ส่วนที่ซ้ำ ---
const styles = StyleSheet.create({
  // Styles หลักของ HomeScreen
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // พื้นหลังสีเทาอ่อนๆ
  },
  topButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // จัดปุ่มให้มีช่องว่างเท่าๆ กัน
    padding: 20,
    paddingTop: (Platform.OS === 'android' ? StatusBar.currentHeight : 0) + 10,
  },
  topButton: {
    flex: 1, // แบ่งพื้นที่ให้ปุ่มเท่ากัน
    flexDirection: 'row',
    backgroundColor: '#1ed760', // สีเขียว
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8, // ระยะห่างระหว่างปุ่ม
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  topButtonText: {
    fontFamily: FONTS.bold,
    color: 'white',
    fontSize: 18,
    marginLeft: 10,
  },
  contentArea: {
    flex: 1, // ทำให้ส่วนนี้ขยายเต็มพื้นที่ที่เหลือ
    // (ลบ justifyContent, alignItems ออก เพื่อให้ Swiper อยู่ด้านบน)
    paddingTop: 20, // เพิ่มระยะห่างจากปุ่มด้านบน
    alignItems: 'center', // จัด Swiper ให้อยู่กลางแนวนอน
  },

  // Styles ของ ImageSwiper
  swiperContainer: {
    width: '100%', // ให้ Swiper กว้างเต็มส่วน contentArea
    height: 300,   // **ต้องกำหนดความสูงให้ Swiper** (ปรับได้ตามต้องการ)
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // ทำให้พื้นหลัง slide ใส
  },
  image: {
    width: width * 0.9, // ใช้ width ที่ import มา
    height: 250,
    borderRadius: 16,
  },
  caption: {
    fontFamily: FONTS.medium,
    marginTop: 12,
    fontSize: 16,
  },
  dot: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 3,
  },
  activeDot: {
    backgroundColor: '#000',
    width: 10,
    height: 10,
    borderRadius: 5,
    margin: 3,
  },
});

// --- 5. ลบ export default ImageSwiper; ที่อยู่ท้ายไฟล์เดิมออก ---