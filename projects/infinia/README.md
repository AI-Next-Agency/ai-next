# INFINIA Projesi

> **Hedef**: INFINIA'yı potansiyel müşteri olarak tanıyıp, AI eğitimi ve danışmanlık hizmetleri sunma

---

## 📂 Klasör Yapısı

```
infinia/
├── README.md                          # Bu dosya - proje rehberi
├── INFINIA_PROFIL.md                 # Şirket detaylı profili ve analizi
├── INFINIA_ASSESSMENT_RESULTS.md     # Assessment form sonuçları (senkronize)
└── notes/                            # (İleride) Toplantı notları, işlem adımları
```

---

## 🎯 Proje Hedefleri

1. ✅ **Şirket Araştırması**: INFINIA'nın derinlemesine profillemesi
2. ✅ **Potansiyel Tanımlama**: AI eğitimi ihtiyaçlarını belirleme
3. ✅ **Assessment**: Form aracılığıyla mevcut yetkinlik seviyesini ölçme
4. ✅ **Otomasyonu**: Google Sheets ↔ Markdown senkronizasyonu
5. 🔄 **Engagement**: Kişiselleştirilmiş curriculum ve pilot proje önerileri

---

## 📋 Dosya Açıklamaları

### **INFINIA_PROFIL.md**
Kapsamlı şirket profili:
- Kuruluş bilgileri ve tarihçe
- İş birimleri ve hizmetleri
- Teknoloji yetkinlikleri
- Sektör deneyimi
- **Önemli**: AI ortaklığı için potansiyel alanlar

### **INFINIA_ASSESSMENT_RESULTS.md**
Assessment form sonuçlarının yapılandırılmış özeti:
- Respondent bilgisi ve tarih
- 6 soruluk assessment yanıtları
- AI maturity seviyesi
- Önerilen curriculum path
- Suggested engagement model

*Bu dosya otomatik olarak güncellenir!* ⚙️

---

## 🤖 Otomasyon: Claude Routine

### **infinia-gsheet-sync**
**Amaç**: Google Sheets form sonuçlarını markdown'a senkronize etme

**Schedule**: Her gün saat 22:00 (10 PM)

**Nasıl Çalışır**:
1. INFINIA Assessment Google Sheets'ine bağlanır
2. En son form yanıtlarını okur
3. INFINIA_ASSESSMENT_RESULTS.md dosyasını günceller
4. AI maturity level belirler
5. Önerilen curriculum path ekler

**Setup Gereken İşler**:
- [ ] Google Sheets assessment formu oluştur
- [ ] Form link'ini paylaş (INFINIA ile)
- [ ] Sheet URL'sini routine konfigürasyonuna ekle
- [ ] First manual run: "Run now" butonuna tıkla

---

## 🚀 İş Akışı

```
1. PROFIL OLUŞTURMA ✅
   └─ INFINIA_PROFIL.md hazır
   
2. ASSESSMENT GÖNDERME 🔄
   ├─ Google Form oluştur
   ├─ INFINIA'ya link gönder
   └─ Yanıtları Sheets'e topla
   
3. OTOMATIK SENKRONIZASYON ⚙️
   └─ Routine her gün çalışır
   
4. ANALIZ VE TAVSIYE 📊
   ├─ Assessment sonuçları analiz et
   ├─ Curriculum öner
   └─ Pilot proje başlat
```

---

## 📊 Assessment Form Soruları

INFINIA'ya gönderilecek 6 soru:

1. **Coding Agents**: Hangi AI coding tools kullanıyor? (Terminal, IDE, Codex App vb.)
2. **LLM Temel Bilgi**: Team'in LLM hakkında temel bilgi seviyesi nedir?
3. **Otomatize Kullanım**: LLM'leri background'da otomatik olarak çalıştırıyor mu?
4. **MCP/Skill/Plugin**: Bu araçları kullanma seviyesi?
5. **AI Beklentileri**: Hangi becerikleri katmak istiyorsunuz?
6. **Endüstri Awareness**: AI endüstrisinin genel durumundan ne kadar haberdar?

*(Detaylar: `/projects/first-form/giray-questions.md`)*

---

## 🎓 Önerilen Curriculum (Genel)

INFINIA'nın profeline göre önerilen konu başlıkları:

- **AI Fundamentals**: LLM'ler, context windows, token kullanımı
- **Coding with AI**: Code generation, code review agents
- **Product Development**: AI-assisted design, prototyping
- **Operations**: AI-powered project management, automation
- **Advanced Topics**: Fine-tuning, custom agents, MCP protokolü

---

## 💬 Sonraki Adımlar

- [ ] **Hazırlık**
  - Assessment formu Google Forms'da oluştur
  - INFINIA'nın uygun iletişim kişisini bul
  
- [ ] **İletişim**
  - Profil + Assessment form linkini gönder
  - 1 hafta sonra follow-up yap
  
- [ ] **Analiz**
  - Yanıtları markdown'a dönüştür (routine yardımı ile)
  - Kişiselleştirilmiş curriculum taslağı hazırla
  
- [ ] **Engagement**
  - Kurucular/teknoloji müdürüyle meeting ayarla
  - Pilot proje önerisi sun
  - Eğitim programı pricing'i belirle

---

## 📞 İletişim Bilgileri

**INFINIA Temel Bilgiler**:
- 📍 Ankara Bilkent Cyberpark
- 🌐 https://infinia.com.tr/tr
- 👔 CEO: Tugay Güzel
- 👥 100-149 çalışan
- 🏆 Great Place To Work® Sertifikalı

**Tavsiye Edilen Bağlantı Noktaları**:
- Kariyer sayfası: https://infinia.com.tr/en/company/career
- İş iletişim: contact@infinia.com.tr (varsayılan)
- LinkedIn: [INFINIA LinkedIn](https://tr.linkedin.com/company/infiniadesignandinnovation)

---

## 📝 Notlar

- Bu klasör **Infinia projesinin merkezi** olacak
- Tüm güncellemeler ve notlar burada tutulacak
- Assessment sonuçları otomatik senkronize olacak
- Müzakerelerin sonuçları `notes/` klasöründe tutulacak

---

## 🔗 Önemli Linkler

**Google Form**: https://docs.google.com/forms/d/1lRAsM5nWe12oPgsm6UdLFSxNwg0M-JVlFurJ2wXQPN8/edit

**Google Sheet**: https://docs.google.com/spreadsheets/d/1WlCetSDiPZeqSeLPRLIWj00c3Uhdx-ulUbne4Y_UN3M/edit

---

**Proje Sahibi**: Nihat & Giray  
**Başlangıç Tarihi**: 2026-04-24  
**Son Güncelleme**: 2026-04-24

---

*Happy selling! 🚀*
