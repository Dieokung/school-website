# เว็บไซต์โรงเรียนโคราชพิทยาคม (Korat Pittayakom School)

เว็บไซต์โรงเรียนแบบ **Static Website** (HTML + CSS + JavaScript ล้วน ไม่มี Backend/Database/Node.js)
พร้อมใช้งานทันทีผ่าน **GitHub Pages**

## โครงสร้างไฟล์

```
school-website/
├── index.html          หน้าแรก
├── about.html           เกี่ยวกับโรงเรียน
├── news.html             ข่าวประชาสัมพันธ์ (มีระบบค้นหา/กรอง)
├── activities.html       กิจกรรม
├── departments.html      บุคลากร/ฝ่ายงาน
├── students.html         สำหรับนักเรียน
├── downloads.html        ดาวน์โหลดเอกสาร
├── contact.html          ติดต่อเรา
├── 404.html              หน้าไม่พบ (GitHub Pages ใช้อัตโนมัติ)
├── css/style.css         สไตล์ทั้งเว็บไซต์
├── js/script.js          สคริปต์ทั้งเว็บไซต์ (เมนู, ข่าว, กิจกรรม, แท็บ, ฟอร์ม ฯลฯ)
├── images/               โลโก้และไอคอน (SVG)
├── files/                วางไฟล์เอกสารสำหรับหน้าดาวน์โหลด
├── robots.txt / sitemap.xml   สำหรับ SEO พื้นฐาน
```

## วิธีแก้ไขข้อมูล

ข้อความที่อยู่ในวงเล็บเหลี่ยม เช่น `[เพิ่มเบอร์โทรศัพท์]` หรือ `[เพิ่มประวัติโรงเรียน]`
คือจุดที่ต้องนำข้อมูลจริงของโรงเรียนมาใส่แทน — ใช้ฟังก์ชัน "ค้นหาและแทนที่" (Find & Replace) ใน VS Code
เพื่อค้นหาคำว่า `[เพิ่ม` แล้วแก้ไขทีละจุดได้อย่างรวดเร็ว

ข้อมูลข่าวและกิจกรรมบนหน้าแรก/หน้าข่าว/หน้ากิจกรรม ถูกเก็บเป็นชุดข้อมูลใน `js/script.js`
(ตัวแปร `NEWS` และ `ACTIVITIES`) แก้ไข เพิ่ม หรือลบรายการได้จากตรงนั้นโดยไม่ต้องแก้ HTML

## วิธีเปิดดูตัวอย่างในเครื่อง (VS Code)

1. เปิดโฟลเดอร์ `school-website` ด้วย VS Code
2. ติดตั้งส่วนเสริม **Live Server** (แนะนำ) แล้วคลิกขวาที่ `index.html` เลือก "Open with Live Server"
   หรือดับเบิลคลิกเปิดไฟล์ `index.html` ด้วยเบราว์เซอร์โดยตรงก็ได้

## วิธีเผยแพร่ด้วย GitHub Pages

1. สร้าง Repository ใหม่บน GitHub (เช่น `school-website`)
2. เปิด Terminal ในโฟลเดอร์นี้แล้วรันคำสั่ง:
   ```bash
   git init
   git add .
   git commit -m "เริ่มต้นเว็บไซต์โรงเรียนโคราชพิทยาคม"
   git branch -M main
   git remote add origin https://github.com/[ชื่อผู้ใช้]/school-website.git
   git push -u origin main
   ```
3. ไปที่ Repository บน GitHub → **Settings → Pages**
4. ในหัวข้อ **Build and deployment** เลือก Source เป็น **Deploy from a branch**
   แล้วเลือก Branch เป็น `main` และโฟลเดอร์เป็น `/ (root)` จากนั้นกด **Save**
5. รอสักครู่ เว็บไซต์จะเผยแพร่ที่ `https://[ชื่อผู้ใช้].github.io/school-website/`
6. แก้ไข `robots.txt` และ `sitemap.xml` ให้ตรงกับ URL จริงที่ได้รับ

## หมายเหตุสำคัญ

- ฟอร์มติดต่อในหน้า `contact.html` เป็นฟอร์มตัวอย่าง (ยังไม่ส่งอีเมลจริง) แนะนำให้เชื่อมต่อกับบริการ
  เช่น Google Forms หรือ [Formspree](https://formspree.io) เพิ่มเติม เนื่องจากเว็บไซต์นี้ไม่มี Backend
- แผนที่ในหน้า `contact.html` เป็นตำแหน่งตัวอย่าง ต้องแก้ไขพิกัด/ที่อยู่ให้ตรงกับที่ตั้งจริงของโรงเรียน
- โลโก้ใน `images/logo.svg` เป็นตราสัญลักษณ์ตัวอย่าง สามารถแทนที่ด้วยไฟล์โลโก้จริงของโรงเรียนได้ทันที
  (แนะนำให้ใช้ไฟล์ `.svg` หรือ `.png` พื้นหลังโปร่งใส ขนาดประมาณ 200×200px)
