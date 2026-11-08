import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Image, Dimensions,
  ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS } from '../theme/fonts';

const { width } = Dimensions.get('window');

const FPang = ({ navigation }) => {
  return (
    <ImageBackground
      source={require('../assets/foq.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />

          <View style={styles.content}>
            {/* ส่วนบน: โลโก้ และ ข้อความต้อนรับ */}
            <View style={styles.topSection}>
              <View style={styles.imageContainer}>
                <View style={styles.circleBg}>
                  <Image
                    source={require('../assets/iconx.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.titleText}>การรู้จำภาพอาหารจานเดียวและประมาณแคลอรี่</Text>
              </View>
            </View>

            {/* ส่วนล่าง: การ์ดปุ่มเข้าใช้งาน */}
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => navigation.navigate('Signup')}
              >
                <Text style={styles.signupButtonText}>ลงทะเบียน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

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
  content: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: 'center',
    paddingVertical: 50,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  circleBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#ffffff', // พื้นหลังวงกลมสีขาวตามแบบ
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  logo: {
    width: 80,
    height: 80,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  titleText: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: '#1A3263', // สีหลักธีมเดิม
    textAlign: 'center',
    lineHeight: 32,
  },
  card: {
    backgroundColor: '#ffffff', // การ์ดสีขาวตามแบบ
    borderRadius: 24,
    padding: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#1A3263', // สีหลักธีมเดิม
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1A3263',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  loginButtonText: {
    color: '#ffffff',
    fontFamily: FONTS.semiBold,
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0', // เส้นแบ่งสีนุ่มนวลขึ้น
    marginVertical: 25,
    width: '100%',
  },
  signupButton: {
    backgroundColor: '#547792', // สีรองธีมเดิม
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#547792',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  signupButtonText: {
    color: '#ffffff',
    fontFamily: FONTS.semiBold,
    fontSize: 18,
  },
});

export default FPang;