/* =========================================================
   โรงเรียนโคราชพิทยาคม — script.js
   Static site JS + ระบบ CMS สำหรับหลังบ้าน (admin.html)
   ข้อมูลจริงของเว็บไซต์เก็บอยู่บน Firebase Firestore (ฟรี)
   ทุกหน้าเว็บโหลดข้อมูลจาก Firestore มาแสดงผลแบบเรียลไทม์
   ครูแก้ผ่าน admin.html แล้วขึ้นเว็บจริงทันที ไม่ต้องอัปโหลดไฟล์
   (ถ้าเชื่อมต่อ Firestore ไม่ได้ จะใช้ data.json หรือค่าเริ่มต้นแทน)
   ========================================================= */

/* ---------- Firebase (Firestore) ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAAGHNNgQwL_5utn1xyqyI7Dw6NgVI5MVc",
  authDomain: "korat-school-website.firebaseapp.com",
  projectId: "korat-school-website",
  storageBucket: "korat-school-website.firebasestorage.app",
  messagingSenderId: "335435106795",
  appId: "1:335435106795:web:a123ebc5fe50e2cb4d31ae",
  measurementId: "G-KM27F2PD7Q",
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);

(function (global) {
  "use strict";

  /* ---------- Utilities ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function getPath(obj, path) {
    return path.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  }
  function setPath(obj, path, value) {
    const keys = path.split(".");
    let o = obj;
    while (keys.length > 1) {
      const k = keys.shift();
      if (typeof o[k] !== "object" || o[k] === null) o[k] = {};
      o = o[k];
    }
    o[keys[0]] = value;
  }
  // ผสานข้อมูลที่บันทึกไว้ (saved) เข้ากับค่าเริ่มต้น (DEFAULTS) แบบ deep merge
  function deepMerge(base, override) {
    if (Array.isArray(base)) return Array.isArray(override) ? override : base;
    if (typeof base === "object" && base !== null) {
      const out = { ...base };
      if (override && typeof override === "object") {
        Object.keys(override).forEach((k) => {
          out[k] = k in base ? deepMerge(base[k], override[k]) : override[k];
        });
      }
      return out;
    }
    return override !== undefined ? override : base;
  }
  function debounce(fn, delay) {
    let timers = {};
    return (key, ...args) => {
      clearTimeout(timers[key]);
      timers[key] = setTimeout(() => fn(key, ...args), delay);
    };
  }

  /* =========================================================
     ข้อมูลเริ่มต้น — ใช้ "เพาะ" ข้อมูลลง Firestore ครั้งแรกที่ฐานข้อมูล
     ยังว่างอยู่ และใช้เป็นค่า fallback ถ้าเชื่อมต่อ Firestore ไม่ได้
     ========================================================= */
  const DEFAULTS = {
    site: {
      logo: "",
      phone: "[เพิ่มเบอร์โทรศัพท์]",
      fax: "[เพิ่มเบอร์โทรสาร]",
      email: "[เพิ่มอีเมล]",
      address: "[เพิ่มที่อยู่โรงเรียน]",
      addressFull: "[เพิ่มที่อยู่โรงเรียนแบบเต็ม รวมรหัสไปรษณีย์]",
      mapQuery: "นครราชสีมา",
      mapNote: "[แก้ไขพิกัด/ที่อยู่ในแผนที่ด้านบนให้ตรงกับตำแหน่งจริงของโรงเรียน]",
      facebook: "#",
      youtube: "#",
      line: "#",
      instagram: "#",
      footerDesc: "[เพิ่มคำอธิบายสั้น ๆ เกี่ยวกับโรงเรียน สำหรับแสดงในส่วนท้ายเว็บไซต์]",
      province: "[ระบุจังหวัด]",
      heroTagline:
        "โรงเรียนโคราชพิทยาคม มุ่งพัฒนาผู้เรียนให้มีความรู้คู่คุณธรรม พร้อมก้าวสู่การเป็นพลเมืองที่มีคุณภาพของสังคมและประเทศชาติ",
      heroFounded: "[ปี]",
      heroStudents: "[จำนวน]",
      heroTeachers: "[จำนวน]",
      heroClassrooms: "[จำนวน]",
      aboutTeaser:
        "โรงเรียนโคราชพิทยาคมให้ความสำคัญกับการพัฒนาผู้เรียนอย่างรอบด้าน ทั้งด้านวิชาการ คุณธรรม จริยธรรม และทักษะชีวิต โดยมีคณะครูผู้เชี่ยวชาญและสภาพแวดล้อมที่เอื้อต่อการเรียนรู้",
      homeVision: "[เพิ่มวิสัยทัศน์โรงเรียน]",
      homeMission: "[เพิ่มพันธกิจโรงเรียน]",
      history:
        "[เพิ่มประวัติโรงเรียน — ปีที่ก่อตั้ง ผู้ก่อตั้ง ความเป็นมา และพัฒนาการที่สำคัญของโรงเรียนตามลำดับเวลา]",
      tl1Year: "[ปี พ.ศ.]",
      tl1Text: "[เพิ่มเหตุการณ์สำคัญ เช่น การก่อตั้งโรงเรียน]",
      tl2Year: "[ปี พ.ศ.]",
      tl2Text: "[เพิ่มเหตุการณ์สำคัญ เช่น การขยายอาคารเรียน]",
      tl3Year: "[ปี พ.ศ.]",
      tl3Text: "[เพิ่มเหตุการณ์สำคัญ เช่น รางวัลหรือการรับรองมาตรฐาน]",
      tl4Text: "[เพิ่มสถานะปัจจุบันของโรงเรียน]",
      vision: "[เพิ่มวิสัยทัศน์ของโรงเรียน ตามที่ระบุในแผนพัฒนาการศึกษา]",
      mission: "[เพิ่มพันธกิจของโรงเรียน แต่ละข้อ]",
      identity: "[เพิ่มเอกลักษณ์และอัตลักษณ์ของนักเรียนโรงเรียนโคราชพิทยาคม]",
      affiliation: "[เพิ่มหน่วยงานต้นสังกัด]",
      level: "[เพิ่มระดับชั้นที่เปิดสอน]",
      studentCount: "[เพิ่มจำนวนนักเรียนปัจจุบัน]",
      staffCount: "[เพิ่มจำนวนครูและบุคลากรทางการศึกษา]",
      schoolColor: "[เพิ่มสีประจำโรงเรียน]",
      motto: "[เพิ่มคติพจน์ประจำโรงเรียน]",
      websiteUrl: "[เพิ่ม URL เว็บไซต์ทางการ]",
    },

    announcements: [
      { id: "an1", icon: "❗", title: "[ตัวอย่าง] ประกาศปิดภาคเรียนที่ [ระบุภาคเรียน]", date: "[เพิ่มวันที่ประกาศ]", detail: "[เพิ่มรายละเอียดเพิ่มเติม]", order: 0 },
      { id: "an2", icon: "📢", title: "[ตัวอย่าง] แจ้งกำหนดการปฐมนิเทศนักเรียนใหม่", date: "[เพิ่มวันที่ประกาศ]", detail: "[เพิ่มรายละเอียดเพิ่มเติม]", order: 1 },
      { id: "an3", icon: "🧾", title: "[ตัวอย่าง] ประกาศแนวปฏิบัติการแต่งกายนักเรียน", date: "[เพิ่มวันที่ประกาศ]", detail: "[เพิ่มรายละเอียดเพิ่มเติม]", order: 2 },
    ],

    news: [
      { id: "n1", title: "[ตัวอย่าง] ประกาศรับสมัครนักเรียนใหม่ ปีการศึกษา [ระบุปี]", category: "ประกาศ", date: "2026-05-01", excerpt: "[เพิ่มรายละเอียดการรับสมัคร คุณสมบัติ และกำหนดการ ณ ที่นี่]", image: "", order: 0 },
      { id: "n2", title: "[ตัวอย่าง] ผลการแข่งขันทักษะวิชาการระดับเขตพื้นที่", category: "ผลงาน", date: "2026-04-18", excerpt: "[เพิ่มรายละเอียดผลการแข่งขันและรายชื่อนักเรียนที่ได้รับรางวัล]", image: "", order: 1 },
      { id: "n3", title: "[ตัวอย่าง] กำหนดการสอบปลายภาคเรียน", category: "วิชาการ", date: "2026-03-02", excerpt: "[เพิ่มรายละเอียดตารางสอบ และแนวปฏิบัติสำหรับนักเรียน]", image: "", order: 2 },
      { id: "n4", title: "[ตัวอย่าง] ประกาศหยุดเรียนกรณีพิเศษ", category: "ประกาศ", date: "2026-02-20", excerpt: "[เพิ่มรายละเอียดเหตุผลและวันที่หยุดเรียน]", image: "", order: 3 },
      { id: "n5", title: "[ตัวอย่าง] โครงการอบรมคุณธรรมจริยธรรมนักเรียน", category: "กิจกรรม", date: "2026-02-10", excerpt: "[เพิ่มรายละเอียดโครงการและภาพกิจกรรม]", image: "", order: 4 },
      { id: "n6", title: "[ตัวอย่าง] ประกาศจัดซื้อจัดจ้าง", category: "จัดซื้อจัดจ้าง", date: "2026-01-15", excerpt: "[เพิ่มรายละเอียดประกาศจัดซื้อจัดจ้างของโรงเรียน]", image: "", order: 5 },
    ],

    activities: [
      { id: "a1", title: "[ตัวอย่าง] กิจกรรมวันไหว้ครู", date: "2026-06-12", desc: "[เพิ่มรายละเอียดกิจกรรมวันไหว้ครูของโรงเรียน]", image: "", order: 0 },
      { id: "a2", title: "[ตัวอย่าง] ค่ายวิชาการเสริมทักษะ STEM", date: "2026-05-25", desc: "[เพิ่มรายละเอียดกิจกรรมค่ายวิชาการ]", image: "", order: 1 },
      { id: "a3", title: "[ตัวอย่าง] กีฬาสีภายในโรงเรียน", date: "2026-05-08", desc: "[เพิ่มรายละเอียดการแข่งขันกีฬาสี]", image: "", order: 2 },
      { id: "a4", title: "[ตัวอย่าง] กิจกรรมจิตอาสาบำเพ็ญประโยชน์", date: "2026-04-20", desc: "[เพิ่มรายละเอียดกิจกรรมจิตอาสา]", image: "", order: 3 },
    ],

    departments: {
      groups: [
        { key: "admin", label: "ฝ่ายบริหาร" },
        { key: "academic", label: "ฝ่ายวิชาการ" },
        { key: "student", label: "ฝ่ายกิจการนักเรียน" },
        { key: "general", label: "ฝ่ายบริหารทั่วไป" },
        { key: "subjects", label: "กลุ่มสาระการเรียนรู้" },
      ],
      staff: [
        { id: "s1", group: "admin", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายบริหาร", photo: "", order: 0 },
        { id: "s2", group: "admin", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายบริหาร", photo: "", order: 1 },
        { id: "s3", group: "admin", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายบริหาร", photo: "", order: 2 },
        { id: "s4", group: "admin", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายบริหาร", photo: "", order: 3 },
        { id: "s5", group: "academic", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายวิชาการ", photo: "", order: 4 },
        { id: "s6", group: "academic", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายวิชาการ", photo: "", order: 5 },
        { id: "s7", group: "academic", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายวิชาการ", photo: "", order: 6 },
        { id: "s8", group: "academic", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายวิชาการ", photo: "", order: 7 },
        { id: "s9", group: "student", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายกิจการนักเรียน", photo: "", order: 8 },
        { id: "s10", group: "student", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายกิจการนักเรียน", photo: "", order: 9 },
        { id: "s11", group: "student", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายกิจการนักเรียน", photo: "", order: 10 },
        { id: "s12", group: "student", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายกิจการนักเรียน", photo: "", order: 11 },
        { id: "s13", group: "general", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายบริหารทั่วไป", photo: "", order: 12 },
        { id: "s14", group: "general", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายบริหารทั่วไป", photo: "", order: 13 },
        { id: "s15", group: "general", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายบริหารทั่วไป", photo: "", order: 14 },
        { id: "s16", group: "general", name: "[เพิ่มชื่อ-สกุล]", role: "ฝ่ายบริหารทั่วไป", photo: "", order: 15 },
        { id: "s17", group: "subjects", name: "[เพิ่มชื่อ-สกุล]", role: "กลุ่มสาระฯ ภาษาไทย", photo: "", order: 16 },
        { id: "s18", group: "subjects", name: "[เพิ่มชื่อ-สกุล]", role: "กลุ่มสาระฯ คณิตศาสตร์", photo: "", order: 17 },
        { id: "s19", group: "subjects", name: "[เพิ่มชื่อ-สกุล]", role: "กลุ่มสาระฯ วิทยาศาสตร์ฯ", photo: "", order: 18 },
        { id: "s20", group: "subjects", name: "[เพิ่มชื่อ-สกุล]", role: "กลุ่มสาระฯ สังคมศึกษาฯ", photo: "", order: 19 },
        { id: "s21", group: "subjects", name: "[เพิ่มชื่อ-สกุล]", role: "กลุ่มสาระฯ ภาษาต่างประเทศ", photo: "", order: 20 },
        { id: "s22", group: "subjects", name: "[เพิ่มชื่อ-สกุล]", role: "กลุ่มสาระฯ ศิลปะ", photo: "", order: 21 },
        { id: "s23", group: "subjects", name: "[เพิ่มชื่อ-สกุล]", role: "กลุ่มสาระฯ สุขศึกษาฯ", photo: "", order: 22 },
        { id: "s24", group: "subjects", name: "[เพิ่มชื่อ-สกุล]", role: "กลุ่มสาระฯ การงานอาชีพ", photo: "", order: 23 },
      ],
    },
  };

  /* ---------- Firebase Authentication (ล็อกอินครูจริง สำหรับ admin.html) ---------- */
  function signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  function signOutUser() {
    return signOut(auth);
  }
  function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  /* ---------- Firestore: อ่านข้อมูล ---------- */
  const byOrder = (a, b) => (a.order || 0) - (b.order || 0);

  async function seedFirestore() {
    const jobs = [setDoc(doc(db, "site", "config"), DEFAULTS.site)];
    DEFAULTS.news.forEach((it) => jobs.push(setDoc(doc(db, "news", it.id), strip(it))));
    DEFAULTS.activities.forEach((it) => jobs.push(setDoc(doc(db, "activities", it.id), strip(it))));
    DEFAULTS.announcements.forEach((it) => jobs.push(setDoc(doc(db, "announcements", it.id), strip(it))));
    DEFAULTS.departments.staff.forEach((it) => jobs.push(setDoc(doc(db, "staff", it.id), strip(it))));
    await Promise.all(jobs);
  }
  function strip(item) {
    const { id, ...rest } = item;
    return rest;
  }

  async function loadData() {
    try {
      let configSnap = await getDoc(doc(db, "site", "config"));
      if (!configSnap.exists()) {
        await seedFirestore();
        configSnap = await getDoc(doc(db, "site", "config"));
      }
      const site = configSnap.exists() ? configSnap.data() : DEFAULTS.site;

      const [newsSnap, actSnap, annSnap, staffSnap] = await Promise.all([
        getDocs(collection(db, "news")),
        getDocs(collection(db, "activities")),
        getDocs(collection(db, "announcements")),
        getDocs(collection(db, "staff")),
      ]);
      const news = newsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder);
      const activities = actSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder);
      const announcements = annSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder);
      const staff = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder);

      return deepMerge(DEFAULTS, {
        site,
        news,
        activities,
        announcements,
        departments: { groups: DEFAULTS.departments.groups, staff },
      });
    } catch (err) {
      console.warn("โหลดจาก Firestore ไม่สำเร็จ ลองใช้ data.json แทน:", err);
      try {
        const res = await fetch("data.json", { cache: "no-store" });
        if (res.ok) return deepMerge(DEFAULTS, await res.json());
      } catch (e2) { /* เงียบไว้ ใช้ DEFAULTS ต่อ */ }
      return DEFAULTS;
    }
  }

  /* ---------- Firestore: เขียนข้อมูล (ใช้โดย admin.html) ---------- */
  function saveSiteConfig(siteObj) {
    return setDoc(doc(db, "site", "config"), siteObj);
  }
  function saveItem(colName, item) {
    return setDoc(doc(db, colName, item.id), strip(item));
  }
  function deleteItem(colName, id) {
    return deleteDoc(doc(db, colName, id));
  }

  /* ---------- ใส่ข้อมูลลงช่อง data-cms / data-cms-href / data-cms-img ทั่วทั้งหน้า ---------- */
  function applyCMS(data) {
    $$("[data-cms]").forEach((el) => {
      const v = getPath(data, el.getAttribute("data-cms"));
      if (v !== undefined && v !== null && v !== "") el.textContent = v;
    });
    // href / src ต้องแยกเพราะ <iframe> ใช้ src ไม่ใช่ href
    $$("[data-cms-href]").forEach((el) => {
      const v = getPath(data, el.getAttribute("data-cms-href"));
      if (!v) return;
      const prefix = el.getAttribute("data-cms-href-prefix") || "";
      const suffix = el.getAttribute("data-cms-href-suffix") || "";
      const clean = prefix.indexOf("tel:") === 0 || prefix.indexOf("mailto:") === 0 ? String(v).replace(/\s/g, "") : v;
      const finalVal = prefix + clean + suffix;
      if (el.tagName === "IFRAME") el.setAttribute("src", finalVal);
      else el.setAttribute("href", finalVal);
    });
    // รูปภาพ (โลโก้ ฯลฯ) — ถ้ายังไม่มีการอัปโหลด จะใช้รูปเดิมใน HTML ต่อไป
    $$("[data-cms-img]").forEach((el) => {
      const v = getPath(data, el.getAttribute("data-cms-img"));
      if (!v) return;
      if (el.tagName === "LINK") { el.removeAttribute("type"); el.setAttribute("href", v); }
      else el.setAttribute("src", v);
    });
  }

  /* ---------- ย่อ/บีบอัดรูปที่อัปโหลดให้เป็น base64 ขนาดเล็กก่อนเก็บลงข้อมูล ---------- */
  function compressImage(file, opts) {
    const maxDim = (opts && opts.maxDim) || 900;
    const quality = (opts && opts.quality) || 0.75;
    const mime = (opts && opts.mime) || "image/jpeg";
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
            else { w = Math.round((w * maxDim) / h); h = maxDim; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL(mime, quality));
        };
        img.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
      reader.readAsDataURL(file);
    });
  }

  /* ---------- 1. Mobile navigation ---------- */
  function initNav() {
    const toggle = $(".nav-toggle");
    const nav = $("#main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.classList.toggle("open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    $$("#main-nav a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------- 2. Active nav link by current page ---------- */
  function markActiveNav() {
    const path = location.pathname.split("/").pop() || "index.html";
    $$(".main-nav a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        a.classList.add("active");
      }
    });
  }

  /* ---------- 3. Back to top ---------- */
  function initBackToTop() {
    const btn = $("#backToTop");
    if (!btn) return;
    window.addEventListener("scroll", () => {
      btn.classList.toggle("show", window.scrollY > 420);
    });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------- 4. Scroll reveal ---------- */
  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
  }

  /* ---------- 5. Footer year ---------- */
  function initYear() {
    $$(".auto-year").forEach((el) => (el.textContent = new Date().getFullYear() + 543));
  }

  function formatThaiDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  }

  /* ---------- 6. Render: homepage news preview + news page ---------- */
  function escapeHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function newsCardHTML(item) {
    const media = item.image
      ? `<img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy">`
      : `📰 [เพิ่มรูปข่าว]`;
    return `
      <article class="card news-card reveal" data-open-news="${item.id}">
        <div class="card-media"><span class="cat">${item.category}</span>${media}</div>
        <div class="card-body">
          <span class="card-date">🗓 ${formatThaiDate(item.date)}</span>
          <h3>${item.title}</h3>
          <p>${item.excerpt}</p>
          <a class="card-link" href="#" data-open-news="${item.id}">อ่านต่อ →</a>
        </div>
      </article>`;
  }

  function renderHomeNews(data) {
    const wrap = $("#homeNewsGrid");
    if (!wrap) return;
    const latest = [...data.news].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    wrap.innerHTML = latest.map(newsCardHTML).join("");
  }

  function initNewsPage(data) {
    const grid = $("#newsGrid");
    if (!grid) return;
    const chips = $$(".chip", $("#newsFilters"));
    const searchInput = $("#newsSearch");
    let activeCategory = "ทั้งหมด";

    function draw() {
      const term = (searchInput.value || "").trim().toLowerCase();
      const filtered = data.news
        .filter((n) => {
          const inCat = activeCategory === "ทั้งหมด" || n.category === activeCategory;
          const inTerm = !term || n.title.toLowerCase().includes(term) || n.excerpt.toLowerCase().includes(term);
          return inCat && inTerm;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      grid.innerHTML = filtered.length
        ? filtered.map(newsCardHTML).join("")
        : `<div class="empty-state">ไม่พบข่าวที่ตรงกับคำค้นหา ลองใช้คำอื่น หรือเลือกหมวดหมู่ "ทั้งหมด"</div>`;
      initReveal();
    }

    chips.forEach((chip) =>
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        activeCategory = chip.dataset.category;
        draw();
      })
    );
    searchInput.addEventListener("input", draw);
    draw();
  }

  /* ---------- 7. Render: activities page ---------- */
  function renderActivities(data) {
    const grid = $("#activitiesGrid") || $("#homeActivitiesGrid");
    if (!grid) return;
    const list = grid.id === "homeActivitiesGrid" ? data.activities.slice(0, 3) : data.activities;
    grid.innerHTML = list
      .map(
        (item) => `
      <article class="card activity-card reveal" data-open-activity="${item.id}">
        <div class="card-media">${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy">` : "🖼 [เพิ่มรูปกิจกรรม]"}</div>
        <div class="card-body">
          <span class="card-date">🗓 ${formatThaiDate(item.date)}</span>
          <h3>${item.title}</h3>
          <p>${item.desc}</p>
        </div>
      </article>`
      )
      .join("");
    initReveal();
  }

  /* ---------- 8. Render: homepage announcements ---------- */
  function renderAnnouncements(data) {
    const wrap = $("#homeAnnounceList");
    if (!wrap) return;
    wrap.innerHTML = (data.announcements || [])
      .map(
        (item) => `
      <div class="announce-item">
        <div class="tag">${item.icon || "📌"}</div>
        <div>
          <h4>${item.title}</h4>
          <span class="date">${item.date} — ${item.detail}</span>
        </div>
      </div>`
      )
      .join("");
  }

  /* ---------- 9. Render: departments/staff page ---------- */
  function renderDepartments(data) {
    const anyGrid = $("[data-staff-group]");
    if (!anyGrid) return;
    const groups = (data.departments && data.departments.groups) || [];
    groups.forEach((g) => {
      const grid = $(`#staffGrid-${g.key}`);
      if (!grid) return;
      const staff = (data.departments.staff || []).filter((s) => s.group === g.key);
      grid.innerHTML = staff
        .map(
          (s) => `
        <div class="card staff-card reveal" data-open-staff="${s.id}">
          <div class="staff-avatar">${s.photo ? `<img src="${s.photo}" alt="${escapeHtml(s.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : "👤"}</div>
          <h4>${s.name}</h4>
          <span>${s.role}</span>
        </div>`
        )
        .join("");
    });
    initReveal();
  }

  /* ---------- 9.5 Popup รายละเอียด (ข่าว / กิจกรรม / บุคลากร) ---------- */
  let CURRENT_DATA = null;

  function ensureModal() {
    if ($("#cmsModalBackdrop")) return;
    const backdrop = document.createElement("div");
    backdrop.className = "cms-modal-backdrop";
    backdrop.id = "cmsModalBackdrop";
    backdrop.innerHTML = `
      <div class="cms-modal-wrap">
        <div class="cms-modal-box" id="cmsModalBox" role="dialog" aria-modal="true"></div>
        <button class="cms-modal-close" id="cmsModalClose" aria-label="ปิด">✕</button>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
    $("#cmsModalClose").addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  }
  function openModal(html) {
    ensureModal();
    $("#cmsModalBox").innerHTML = html;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => $("#cmsModalBackdrop").classList.add("open"));
  }
  function closeModal() {
    const bd = $("#cmsModalBackdrop");
    if (bd) bd.classList.remove("open");
    document.body.style.overflow = "";
  }

  function openNewsModal(id) {
    const item = (CURRENT_DATA.news || []).find((n) => n.id === id);
    if (!item) return;
    const media = item.image ? `<img class="cms-modal-media" src="${item.image}" alt="${escapeHtml(item.title)}">` : "";
    openModal(`
      ${media}
      <div class="cms-modal-body">
        <span class="cms-modal-tag">${escapeHtml(item.category || "")}</span>
        <span class="cms-modal-date">🗓 ${formatThaiDate(item.date)}</span>
        <h2>${escapeHtml(item.title)}</h2>
        <p class="cms-modal-text">${escapeHtml(item.content || item.excerpt || "")}</p>
      </div>`);
  }

  function openActivityModal(id) {
    const item = (CURRENT_DATA.activities || []).find((a) => a.id === id);
    if (!item) return;
    const media = item.image ? `<img class="cms-modal-media" src="${item.image}" alt="${escapeHtml(item.title)}">` : "";
    openModal(`
      ${media}
      <div class="cms-modal-body">
        <span class="cms-modal-date">🗓 ${formatThaiDate(item.date)}</span>
        <h2>${escapeHtml(item.title)}</h2>
        <p class="cms-modal-text">${escapeHtml(item.desc || "")}</p>
      </div>`);
  }

  function openStaffModal(id) {
    const item = ((CURRENT_DATA.departments && CURRENT_DATA.departments.staff) || []).find((s) => s.id === id);
    if (!item) return;
    const avatar = item.photo
      ? `<img class="cms-modal-avatar" src="${item.photo}" alt="${escapeHtml(item.name)}">`
      : `<div class="cms-modal-avatar" style="display:grid;place-items:center;background:var(--navy-soft);color:var(--navy-light);font-size:2rem;">👤</div>`;
    openModal(`
      ${avatar}
      <div class="cms-modal-body" style="text-align:center;">
        <h2>${escapeHtml(item.name)}</h2>
        <span class="role">${escapeHtml(item.role)}</span>
        ${item.bio ? `<p class="cms-modal-text" style="text-align:left;">${escapeHtml(item.bio)}</p>` : ""}
      </div>`);
  }

  function initDetailModals() {
    document.addEventListener("click", (e) => {
      const newsEl = e.target.closest("[data-open-news]");
      const actEl = e.target.closest("[data-open-activity]");
      const staffEl = e.target.closest("[data-open-staff]");
      if (newsEl) { e.preventDefault(); openNewsModal(newsEl.getAttribute("data-open-news")); }
      else if (actEl) { e.preventDefault(); openActivityModal(actEl.getAttribute("data-open-activity")); }
      else if (staffEl) { e.preventDefault(); openStaffModal(staffEl.getAttribute("data-open-staff")); }
    });
  }

  /* ---------- 10. Tabs (departments page) ---------- */
  function initTabs() {
    const tabButtons = $$(".tab-btn");
    if (!tabButtons.length) return;
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tab;
        tabButtons.forEach((b) => b.classList.toggle("active", b === btn));
        $$(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.id === target));
      });
    });
  }

  /* ---------- 11. Accordion (students page) ---------- */
  function initAccordion() {
    $$(".accordion-trigger").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const item = trigger.closest(".accordion-item");
        const panel = $(".accordion-panel", item);
        const isOpen = item.classList.toggle("open");
        panel.style.maxHeight = isOpen ? panel.scrollHeight + "px" : null;
        trigger.setAttribute("aria-expanded", String(isOpen));
      });
    });
  }

  /* ---------- 12. Contact form (no backend — demo only) ---------- */
  function initContactForm() {
    const form = $("#contactForm");
    if (!form) return;
    const note = $("#formNote");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      note.textContent =
        "ขอบคุณสำหรับข้อความ (นี่คือฟอร์มตัวอย่าง — เว็บไซต์ Static ยังไม่ได้เชื่อมต่อระบบส่งอีเมลจริง กรุณาเชื่อมต่อบริการฟอร์ม เช่น Google Form หรือ Formspree)";
      note.style.color = "var(--success)";
      form.reset();
    });
  }

  /* ---------- Init (หน้าเว็บทั่วไป) ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    markActiveNav();
    initBackToTop();
    initYear();
    initTabs();
    initAccordion();
    initContactForm();
    initDetailModals();

    loadData().then((data) => {
      CURRENT_DATA = data;
      applyCMS(data);
      renderHomeNews(data);
      initNewsPage(data);
      renderActivities(data);
      renderAnnouncements(data);
      renderDepartments(data);
      initReveal();
    });
  });

  /* ---------- เปิดให้ admin.html เรียกใช้ฟังก์ชัน/ข้อมูลชุดเดียวกันได้ ---------- */
  global.SchoolCMS = {
    DEFAULTS, deepMerge, loadData, applyCMS, getPath, setPath, formatThaiDate,
    compressImage, saveSiteConfig, saveItem, deleteItem, debounce,
    signIn, signOutUser, onAuthChange,
  };
  global.dispatchEvent(new Event("schoolcms:ready"));
})(window);
