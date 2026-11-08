# การรู้จำภาพอาหารจานเดียวและประมาณแคลอรี่ (Mobile Application)

แอปพลิเคชันถ่ายและบันทึกข้อมูลโภชนาการอาหาร พัฒนาด้วย React Native (Expo) และเชื่อมต่อฐานข้อมูลด้วย Firebase Firestore / Firebase Auth

## ข้อกำหนดเบื้องต้น (Prerequisites)

* **Node.js**: เวอร์ชัน LTS (v18 หรือใหม่กว่า)
* **npm**: ติดตั้งพร้อมกับ Node.js
* **Expo Go หรือ Android Studio / อุปกรณ์ Android จริง** สำหรับทดสอบแอป
* **บัญชี Expo / EAS** (หากต้องการ Build APK)

## เริ่มต้นติดตั้งโปรเจกต์ (Installation)

1. Clone repository:

   ```bash
   git clone https://github.com/N0ppakun/Noppakun_Rachakrom.git
   cd Noppakun_Rachakrom
   cd "Noppakun Rachakrom"
   ```

2. ติดตั้ง Dependencies:

   ```bash
   npm install
   ```

3. เริ่มต้นรันแอปพลิเคชัน (Development):

   ```bash
   npx expo start
   ```

4. สแกน QR Code ผ่านแอป **Expo Go** บนอุปกรณ์มือถือ (Android/iOS) เพื่อเปิดใช้งานแอป

# ขั้นตอนการ Build APK 

1. ขั้นตอนที่1เข้าโฟลเดอร์โปรเจ็ค:

   ```bash
   cd Noppakun_Rachakrom
   cd "Noppakun Rachakrom"
   ```

2. ขั้นตอนที่2เขียนคำสั่งEAS:

   ```bash
   `eas build -p android --profile preview`
   ```
# คลิปวีดิโอคู่มือการใช้แอป

https://youtu.be/I2RuQW2eqdo
