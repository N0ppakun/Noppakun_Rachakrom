import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Platform, StatusBar, ActivityIndicator, ScrollView,
  Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FONTS } from '../theme/fonts';

export default function SettingScreen() {
  const [userData, setUserData] = useState(null); // State เก็บข้อมูลโปรไฟล์
  const [loading, setLoading] = useState(true);

  // States สำหรับแก้ไขชื่อ
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false); // State สำหรับควบคุม Pop-up ออกจากระบบ

  // --- 1. ฟังก์ชันดึงข้อมูลโปรไฟล์ ---
  useFocusEffect(
    React.useCallback(() => {
      const fetchUserData = async () => {
        setLoading(true);
        const user = auth.currentUser;

        if (user) {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              email: user.email,
              name: data.name, 
              gender: data.gender || '-',
              weight: data.weight || '-',
              height: data.height || '-',
              age: data.age || '-',
              bmr: data.bmr || '-',
              tdee: data.tdee || '-',
              activityLevel: data.activityLevel || '-',
            });
          } else {
            setUserData({ email: user.email, name: 'User', gender: '-', weight: '-', height: '-', age: '-', bmr: '-', tdee: '-', activityLevel: '-' });
          }
        }
        setLoading(false);
      };

      fetchUserData();
    }, [])
  );

  // --- 2. ฟังก์ชันแก้ไขชื่อเล่นและอัปเดตลง Firestore ---
  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setIsSavingName(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        // ทำการบันทึกทับแบบ merge: true
        await setDoc(userDocRef, { name: newName }, { merge: true });
        
        // อัปเดตข้อมูลในหน้าจอ
        setUserData(prev => ({ ...prev, name: newName }));
        setIsEditModalVisible(false);
      }
    } catch (error) {
      console.error("Error updating name: ", error);
    }
    setIsSavingName(false);
  };

  // --- 3. ฟังก์ชันออกจากระบบ ---
  const handleSignOut = () => {
    setIsSignOutModalVisible(false);
    signOut(auth)
      .then(() => {
        console.log('User signed out!');
      })
      .catch(error => {
        console.error('Sign out error', error);
      });
  };

  // --- 4. ส่วนแสดงผล ---
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3263" />
      
      {/* Header ส่วนบนสุด */}
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="person" size={24} color="#ffffff" />
          </View>
          <Text style={styles.headerTitle}>บัญชีของฉัน</Text>
        </View>
      </View>

      {/* เนื้อหาหลักด้านล่าง */}
      <View style={styles.mainContent}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* --- Card 1: ข้อมูลผู้ใช้โดยสรุป --- */}
          <View style={styles.profileHeaderCard}>
            {loading ? (
              <ActivityIndicator size="small" color="#1A3263" style={{ flex: 1, paddingVertical: 15 }} />
            ) : userData ? (
              <>
                <View style={styles.avatarContainer}>
                  <Ionicons name="person-circle-outline" size={70} color="#547792" />
                </View>
                <View style={styles.profileInfoContainer}>
                  <Text style={styles.profileNameText}>{userData.name}</Text>
                  <Text style={styles.profileEmailText}>{userData.email}</Text>
                </View>
              </>
            ) : (
              <Text style={{ flex: 1, textAlign: 'center' }}>ไม่พบข้อมูลผู้ใช้</Text>
            )}
          </View>

          {/* --- Card 2: ข้อมูลส่วนตัวโปรไฟล์ --- */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>รูปโปรไฟล์</Text>
            <View style={styles.infoCardTitleLine} />

            {loading ? (
              <ActivityIndicator size="small" color="#1A3263" style={{ paddingVertical: 15 }} />
            ) : userData ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ชื่อ</Text>
                  <View style={styles.infoValueRow}>
                    <Text style={styles.infoValueText}>{userData.name || '-'}</Text>
                    <TouchableOpacity 
                      style={styles.editButton} 
                      onPress={() => {
                        setNewName(userData.name || '');
                        setIsEditModalVisible(true);
                      }}
                    >
                      <Text style={styles.editButtonText}>แก้ไขชื่อ</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.infoValueRowSimple}>
                  <Text style={styles.infoLabelSimple}>เพศ</Text>
                  <Text style={styles.infoValueTextSimple}>{userData.gender || '-'}</Text>
                </View>

                <View style={styles.infoValueRowSimple}>
                  <Text style={styles.infoLabelSimple}>อายุ</Text>
                  <Text style={styles.infoValueTextSimple}>{userData.age || '-'} ปี</Text>
                </View>

                <View style={styles.infoValueRowSimple}>
                  <Text style={styles.infoLabelSimple}>ส่วนสูง</Text>
                  <Text style={styles.infoValueTextSimple}>{userData.height ? `${userData.height} ซม.` : '-'}</Text>
                </View>

                <View style={styles.infoValueRowSimple}>
                  <Text style={styles.infoLabelSimple}>น้ำหนัก</Text>
                  <Text style={styles.infoValueTextSimple}>{userData.weight ? `${userData.weight} กก.` : '-'}</Text>
                </View>

                <View style={styles.infoValueRowSimple}>
                  <Text style={styles.infoLabelSimple}>BMR (พลังงานพื้นฐาน)</Text>
                  <Text style={styles.infoValueTextSimple}>{userData.bmr ? `${userData.bmr} kcal` : '-'}</Text>
                </View>

                <View style={styles.infoValueRowSimple}>
                  <Text style={styles.infoLabelSimple}>TDEE (พลังงานที่ต้องการต่อวัน)</Text>
                  <Text style={styles.infoValueTextSimple}>{userData.tdee ? `${userData.tdee} kcal` : '-'}</Text>
                </View>
              </>
            ) : (
              <Text style={{ textAlign: 'center' }}>ไม่พบข้อมูลส่วนตัว</Text>
            )}
          </View>

          {/* --- Card 3: ปุ่มออกจากระบบ --- */}
          <View style={styles.signOutCard}>
            <TouchableOpacity style={styles.signOutButton} onPress={() => setIsSignOutModalVisible(true)}>
              <MaterialCommunityIcons name="logout" size={20} color="#ff4d4d" />
              <Text style={styles.signOutText}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>

      {/* Modal แก้ไขชื่อ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitleText}>แก้ไขชื่อผู้ใช้</Text>
            
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="ระบุชื่อใหม่ของคุณ"
              placeholderTextColor="#999"
              autoFocus
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={[styles.modalActionBtn, styles.modalCancelBtn]} 
                onPress={() => setIsEditModalVisible(false)}
                disabled={isSavingName}
              >
                <Text style={styles.modalCancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalActionBtn, styles.modalSaveBtn]} 
                onPress={handleSaveName}
                disabled={isSavingName}
              >
                {isSavingName ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>บันทึก</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal ยืนยันการออกจากระบบ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isSignOutModalVisible}
        onRequestClose={() => setIsSignOutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.confirmTitleText}>คุณต้องการออกจากระบบใช่หรือไม่</Text>
            
            <View style={styles.confirmIconContainer}>
              <MaterialCommunityIcons name="logout" size={80} color="#ff4d4d" />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={[styles.confirmActionBtn, styles.confirmCancelBtn]} 
                onPress={() => setIsSignOutModalVisible(false)}
              >
                <Text style={styles.confirmCancelBtnText}>ไม่</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.confirmActionBtn, styles.confirmYesBtn]} 
                onPress={handleSignOut}
              >
                <Text style={styles.confirmYesBtnText}>ใช่</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A3263', // ให้สีสเตตัสบาร์ด้านบนเป็นสีกรมท่า
  },
  appHeader: {
    backgroundColor: '#1A3263',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'ios' ? 25 : 35,
    paddingBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitle: {
    fontFamily: FONTS.displayBold,
    color: '#ffffff',
    fontSize: 24,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#E8E2DB', // พื้นหลังของหน้านี้ใช้สีธีมพื้นหลังเดิม E8E2DB
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  // --- Profile Summary Card (Card 1) ---
  profileHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 20,
  },
  profileInfoContainer: {
    flex: 1,
  },
  profileNameText: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: '#1A3263',
    marginBottom: 4,
  },
  profileEmailText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#547792',
  },
  // --- Profile Personal Details Card (Card 2) ---
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  infoCardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: '#1A3263',
    marginBottom: 8,
  },
  infoCardTitleLine: {
    height: 1.5,
    backgroundColor: '#333333', // เส้นคั่นหนาสีเข้มตามแบบ
    marginBottom: 15,
    width: '100%',
  },
  infoRow: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    paddingBottom: 10,
  },
  infoLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
  },
  infoValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoValueText: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    color: '#333333',
  },
  editButton: {
    backgroundColor: '#91C4F2', // ปุ่มสีฟ้าแก้ไขชื่อตามภาพ
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontFamily: FONTS.semiBold,
    color: '#ffffff',
    fontSize: 13,
  },
  infoValueRowSimple: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  infoLabelSimple: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: '#333333',
  },
  infoValueTextSimple: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: '#547792',
  },
  // --- Sign Out Card (Card 3) ---
  signOutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ff4d4d', // เส้นขอบสีแดงตามแบบ
    backgroundColor: '#ffffff',
  },
  signOutText: {
    fontFamily: FONTS.bold,
    color: '#ff4d4d', // สีข้อความสีแดงตามแบบ
    fontSize: 16,
    marginLeft: 10,
  },
  // --- Modal Edit Name Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  modalTitleText: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: '#1A3263',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    fontFamily: FONTS.regular,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    width: '100%',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  modalCancelBtnText: {
    fontFamily: FONTS.medium,
    color: '#555555',
    fontSize: 16,
  },
  modalSaveBtn: {
    backgroundColor: '#1A3263',
    marginLeft: 10,
  },
  modalSaveBtnText: {
    fontFamily: FONTS.semiBold,
    color: '#ffffff',
    fontSize: 16,
  },
  confirmTitleText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmIconContainer: {
    marginBottom: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelBtn: {
    borderColor: '#333333',
    backgroundColor: '#ffffff',
    marginRight: 15,
  },
  confirmCancelBtnText: {
    fontFamily: FONTS.medium,
    color: '#333333',
    fontSize: 16,
  },
  confirmYesBtn: {
    borderColor: '#ff4d4d',
    backgroundColor: '#ffffff',
    marginLeft: 15,
  },
  confirmYesBtnText: {
    fontFamily: FONTS.semiBold,
    color: '#ff4d4d',
    fontSize: 16,
  },
});