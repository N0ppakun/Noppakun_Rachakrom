import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, ActivityIndicator, Platform, StatusBar, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { FONTS } from '../theme/fonts';

// --- ฟังก์ชันย่อยสำหรับแสดงผลมื้ออาหารแต่ละหมวด ---
const MealCategory = ({ title, data, totalCal, onDelete }) => {
  // กำหนดสีกรอบและสีพื้นหลังตามประเภทมื้ออาหาร
  let borderColor = '#ccc';
  let bgColor = '#fff';

  if (title === 'มื้อเช้า') {
    borderColor = '#FAB95B'; // สีเหลือง/ทอง
    bgColor = '#FFFCEE';
  } else if (title === 'มื้อเที่ยง') {
    borderColor = '#FA9E5B'; // สีส้ม
    bgColor = '#FFF4EE';
  } else if (title === 'มื้อเย็น') {
    borderColor = '#B19FFB'; // สีม่วง
    bgColor = '#F5EEFF';
  }

  return (
    <View style={[styles.mealCard, { borderColor, backgroundColor: bgColor }]}>
      <View style={styles.mealCardHeader}>
        <Text style={styles.mealCardTitle}>{title}</Text>
        <Text style={styles.mealCardTotalCal}>{`${totalCal} kcal`}</Text>
      </View>
      <View style={styles.mealCardLine} />

      {data.map(item => {
        let calorieText = '... kcal';
        if (item.status === 'completed' && item.calories !== null) {
          calorieText = `${item.calories} kcal`;
        } else if (item.status === 'error') {
          calorieText = 'Error';
        } else if (item.status === 'pending') {
          calorieText = 'Calculating...';
        }

        let timeText = '';
        if (item.createdAt) {
          const date = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
          if (!isNaN(date.getTime())) {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            timeText = ` (${hours}:${minutes} น.)`;
          }
        }

        return (
          <View key={item.id} style={styles.mealItemRow}>
            <Text style={styles.mealItemName}>
              {item.foodName}
              {timeText ? <Text style={styles.mealTimeText}>{timeText}</Text> : null}
            </Text>
            
            <View style={styles.mealItemRight}>
              <View style={styles.mealItemCalContainer}>
                <Text style={styles.mealItemCalText}>{calorieText}</Text>
              </View>
              
              <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteButton}>
                <Ionicons name="trash" size={20} color="#e53e3e" />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
};


export default function FoodScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(''); // เพิ่ม state สำหรับดึงชื่อผู้ใช้
  const [tdee, setTdee] = useState(2000); // ค่าเริ่มต้น 2000 kcal
  
  const [breakfast, setBreakfast] = useState([]);
  const [lunch, setLunch] = useState([]);
  const [dinner, setDinner] = useState([]);

  // --- States สำหรับแคลอรี ---
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalBreakfast, setTotalBreakfast] = useState(0);
  const [totalLunch, setTotalLunch] = useState(0);
  const [totalDinner, setTotalDinner] = useState(0);

  // --- State สำหรับ Pop-up ยืนยันการลบ ---
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // --- 1. ฟังก์ชันดึงข้อมูล ---
  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) { setLoading(false); return; }

      // ดึงข้อมูลชื่อเล่น / ชื่อผู้ใช้จาก Firestore
      const userDocRef = doc(db, "users", user.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserName(data.name || 'ผู้ใช้งาน');
          if (data.tdee) {
            setTdee(data.tdee);
          }
        }
      });

      // ดึงข้อมูลมื้ออาหาร
      const q = query(collection(db, "meals"), where("userId", "==", user.uid));
      
      const unsubscribeMeals = onSnapshot(q, (querySnapshot) => {
        const mealsData = [];
        querySnapshot.forEach((doc) => {
          mealsData.push({ id: doc.id, ...doc.data() });
        });

        // จัดกลุ่มข้อมูลและเรียงลำดับเวลาจากเก่าไปใหม่
        const sortByTime = (a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return timeA - timeB;
        };

        const breakfastData = mealsData.filter(m => m.mealType === 'มื้อเช้า').sort(sortByTime);
        const lunchData = mealsData.filter(m => m.mealType === 'มื้อเที่ยง').sort(sortByTime);
        const dinnerData = mealsData.filter(m => m.mealType === 'มื้อเย็น').sort(sortByTime);
        
        setBreakfast(breakfastData);
        setLunch(lunchData);
        setDinner(dinnerData);

        // คำนวณแคลอรี
        const calcTotal = (arr) => arr.reduce((sum, item) => {
          return sum + (item.calories || 0); 
        }, 0);

        const breakfastCal = calcTotal(breakfastData);
        const lunchCal = calcTotal(lunchData);
        const dinnerCal = calcTotal(dinnerData);

        setTotalBreakfast(breakfastCal);
        setTotalLunch(lunchCal);
        setTotalDinner(dinnerCal);
        setTotalCalories(breakfastCal + lunchCal + dinnerCal);

        setLoading(false);
      }, (error) => {
        console.error("Error fetching meals: ", error);
        setLoading(false);
      });

      return () => {
        unsubscribeUser();
        unsubscribeMeals();
      };
    }, [])
  );

  // --- ฟังก์ชันเปิด Modal ยืนยันการลบ ---
  const openDeleteModal = (id) => {
    setItemToDelete(id);
    setDeleteModalVisible(true);
  };

  // --- ฟังก์ชันลบรายการอาหารเมื่อกด ยืนยัน ---
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, "meals", itemToDelete));
    } catch (e) { 
      console.error("Error deleting document: ", e); 
    } finally {
      setDeleteModalVisible(false);
      setItemToDelete(null);
    }
  };

  // --- ส่วนแสดงผลหลัก ---
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3263" />
      
      {/* Header ส่วนบนสุด */}
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="food" size={30} color="#ffffff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerWelcome}>ยินดีต้อนรับ</Text>
            <Text style={styles.headerName}>{userName || 'ผู้ใช้งาน'}</Text>
          </View>
        </View>
      </View>

      {/* เนื้อหาหลักด้านล่าง */}
      <View style={styles.mainContent}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* --- Card: สรุปแคลอรี่รายวัน --- */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>สรุปแคลอรีรายวัน</Text>
            <View style={styles.summaryTitleLine} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>เป้าหมายการกิน (TDEE)</Text>
              <View style={styles.summaryValueContainer}>
                <Text style={styles.summaryValueText}>{`${tdee} kcal`}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ทานไปแล้ว (Consumed)</Text>
              <View style={styles.summaryValueContainer}>
                <Text style={styles.summaryValueText}>{`${totalCalories.toFixed(0)} kcal`}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>คงเหลือ (Remaining)</Text>
              <View style={[
                styles.summaryValueContainer,
                { backgroundColor: (tdee - totalCalories) >= 0 ? '#E2E8F0' : '#FED7D7' }
              ]}>
                <Text style={[
                  styles.summaryValueText,
                  { color: (tdee - totalCalories) >= 0 ? '#333333' : '#E53E3E' }
                ]}>
                  {`${(tdee - totalCalories).toFixed(0)} kcal`}
                </Text>
              </View>
            </View>

            {/* --- หลอดแสดงความคืบหน้าแคลอรี --- */}
            <View style={styles.progressBarSection}>
              <View style={styles.progressHeaderRow}>
                <Text style={styles.progressTitleText}>ความคืบหน้าแคลอรี</Text>
                <Text style={[
                  styles.progressPercentText,
                  { color: totalCalories > tdee ? '#E53E3E' : '#1A3263' }
                ]}>
                  {`${((totalCalories / (tdee || 1)) * 100).toFixed(0)}%`}
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${Math.min(Math.max((totalCalories / (tdee || 1)) * 100, 0), 100)}%`,
                      backgroundColor: totalCalories > tdee 
                        ? '#E53E3E' 
                        : (totalCalories / (tdee || 1) > 0.85 ? '#FA9E5B' : '#1A3263')
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* --- แสดงรายการอาหาร --- */}
          {loading ? ( 
            <ActivityIndicator size="large" color="#547792" style={{ marginTop: 20 }} />
          ) : (
            <>
              <MealCategory 
                title="มื้อเช้า" 
                data={breakfast} 
                totalCal={totalBreakfast.toFixed(0)}
                onDelete={openDeleteModal}
              />
              <MealCategory 
                title="มื้อเที่ยง" 
                data={lunch} 
                totalCal={totalLunch.toFixed(0)}
                onDelete={openDeleteModal}
              />
              <MealCategory 
                title="มื้อเย็น" 
                data={dinner} 
                totalCal={totalDinner.toFixed(0)}
                onDelete={openDeleteModal}
              />
            </>
          )}

        </ScrollView>
      </View>

      {/* --- Modal ป๊อบอัปยืนยันการลบ --- */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setDeleteModalVisible(false);
          setItemToDelete(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalBox}>
            <Text style={styles.confirmModalText}>คุณต้องการลบหรือไม่</Text>
            
            <View style={styles.confirmModalBtnRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setItemToDelete(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelModalBtnText}>ยกเลิก</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmModalBtn}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmModalBtnText}>ยืนยัน</Text>
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
    backgroundColor: '#1A3263', // สีน้ำเงินหลักของธีมเดิม
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'ios' ? 25 : 35, // ขยับข้อความด้านในแถบกรมท่าลงมาด้านล่าง
    paddingBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  headerWelcome: {
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    marginBottom: 2,
  },
  headerName: {
    fontFamily: FONTS.bold,
    color: '#ffffff',
    fontSize: 22,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#E8E2DB', // พื้นหลังส่วนล่างสีเดิม E8E2DB
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  summaryCard: {
    backgroundColor: '#DDF0FF', // สีฟ้าอ่อนตามแบบ
    borderColor: '#547792', // สีกรอบตามธีมเดิม
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  summaryTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: '#1A3263', // สีหลักธีมเดิม
    marginBottom: 8,
  },
  summaryTitleLine: {
    height: 1.5,
    backgroundColor: '#1A3263',
    marginBottom: 15,
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: '#333333',
  },
  summaryValueContainer: {
    borderWidth: 1,
    borderColor: '#333333', // เส้นขอบปุ่มสีเข้มตามแบบ
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 15,
    backgroundColor: '#E2E8F0', // กล่องใส่ค่าเทาอ่อน
    minWidth: 120,
    alignItems: 'center',
  },
  summaryValueText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: '#333333',
  },
  progressBarSection: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 50, 99, 0.15)',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitleText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#333333',
  },
  progressPercentText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  progressBarTrack: {
    height: 14,
    backgroundColor: '#C8E4FF',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#547792',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  mealCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: 6,
  },
  mealCardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: '#333333',
  },
  mealCardTotalCal: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: '#666666',
  },
  mealCardLine: {
    height: 1.5,
    backgroundColor: '#333333', // เส้นแบ่งสีเข้มตามแบบ
    marginBottom: 12,
  },
  mealItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  mealItemName: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: '#333333',
    flex: 1,
    marginRight: 10,
  },
  mealTimeText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#718096',
  },
  mealItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealItemCalContainer: {
    borderWidth: 1,
    borderColor: '#333333', // เส้นขอบสีเข้มตามแบบ
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  mealItemCalText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: '#333333',
  },
  deleteButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalBox: {
    width: '82%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 35,
    paddingHorizontal: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  confirmModalText: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: '#385269',
    textAlign: 'center',
    marginBottom: 35,
  },
  confirmModalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  cancelModalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#333333',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: '#333333',
  },
  confirmModalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF4D4D',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: '#FF4D4D',
  },
});