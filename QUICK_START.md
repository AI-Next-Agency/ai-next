# 🚀 Şirket Onboarding - Quick Start Guide

> Yeni bir şirket ekle ve otomatik pipeline'ı başlat - 5 dakika

---

## ⚡ TL;DR (En Hızlı Yol)

```bash
# 1. Repo'ya gir
cd /Users/nihat/DevS/ai-next

# 2. Komut çalıştır (yeni şirket için)
python scripts/add_company.py --name "Şirket Adı" --url "https://website.com"

# 3. Folder'a gir
cd projects/sirket-adi

# 4. README'yi aç ve önemli linkler ekle
# - Google Form URL
# - Google Sheet URL

# 5. Yapılır! Şirket her gün otomatik senkronize olacak 🎉
```

---

## 📋 Detaylı Adımlar

### **1️⃣ Yeni Şirket Ekleme**

```bash
python scripts/add_company.py --name "Boğaziçi Yazılım" --url "https://bogazi.com"
```

**Ne olur?**
- ✅ `projects/bogazi-yazilim/` klasörü oluşturulur
- ✅ `README.md`, `STATUS.md`, profil dosyası yaratılır
- ✅ Assessment template kopyalanır
- ✅ Git'e otomatik commit yapılır

**Çıktı Örneği**:
```
🚀 Boğaziçi Yazılım için onboarding pipeline başlatılıyor...

   ✅ Klasör oluşturuldu: projects/bogazi-yazilim/
   ✅ Profil oluşturuldu: BOGAZI_YAZILIM_PROFIL.md
   ✅ README oluşturuldu: README.md
   ✅ Assessment template kopyalandı: ASSESSMENT_TEMPLATE.md
   ✅ Status dosyası oluşturuldu: STATUS.md
   ✅ Notes klasörü oluşturuldu: notes/
   ✅ Git commit: bogazi-yazilim

╔═══════════════════════════════════════════════════════╗
║  ✅ Boğaziçi Yazılım Onboarding Tamamlandı!          ║
╚═══════════════════════════════════════════════════════╝

📂 Proje Lokasyonu: projects/bogazi-yazilim/
```

---

### **2️⃣ Şirket Araştırması**

```bash
cd projects/bogazi-yazilim/
cat BOGAZI_YAZILIM_PROFIL.md
```

Şu bilgileri doldur:
- [ ] Web sitesinden kuruluş yılı, çalışan sayısı
- [ ] LinkedIn'den şirket info
- [ ] İş kolları ve hizmetler
- [ ] Teknoloji stack (tahmin et)
- [ ] AI ortaklığı potansiyeli

**Kaynaklar**:
- Google (şirket adı + bilgi)
- LinkedIn (company page)
- Website (hakkımızda, takım)
- Crunchbase (funding, growth)

---

### **3️⃣ Google Form Oluşturma**

**Şablon**: `ASSESSMENT_TEMPLATE.md` (klasöründe)

**Nasıl?**
1. Google Forms'a git: https://forms.google.com
2. **Blank form** → "Untitled form" başlık gir
3. **6 soru ekle** (ASSESSMENT_TEMPLATE.md'den kopyala):
   - Coding Agents kullanımı
   - LLM temel bilgi seviyesi
   - Otomatize LLM kullanımı
   - MCP/Skill/Plugin yetkinliği
   - AI'dan beklentiler
   - Genel AI farkındalığı

4. **Şahsı bilgi bölümü ekle**:
   - İsim Soyadı
   - Email
   - Telefon
   - LinkedIn (opsiyonel)

5. **Form link'ini kopyala**

---

### **4️⃣ Google Sheet Oluşturma**

**Nasıl?**
1. Google Sheets'e git: https://sheets.google.com
2. **New spreadsheet** → adı gir
3. **Form responses ekle**:
   - Google Form'un **Responses** sekmesi
   - "Link to Google Sheets" tıkla
   - Existing sheet'e bağla VEYA yeni sheet oluştur

4. **Sheet link'ini kopyala**

**İpucu**: Sheet'i otomatik olarak form response'larını topla

---

### **5️⃣ README'ye Link Ekle**

```bash
cd projects/sirket-adi/
nano README.md
```

Şu satırları bul ve güncelle:
```markdown
## 📋 Important Links

**Google Form**: https://docs.google.com/forms/d/FORM_ID/edit
**Google Sheet**: https://docs.google.com/spreadsheets/d/SHEET_ID/edit
```

Kaydet ve çık.

---

### **6️⃣ STATUS.md'yi Güncelle**

```bash
nano STATUS.md
```

Şu checklist'i güncelle:
```markdown
- [x] Klasör yapısı oluşturuldu
- [x] Profil template'i hazırlandı
- [x] README.md yazıldı
- [x] Assessment template kopyalandı
- [x] Google Form oluşturuldu  ← Buraya ✅ koy
- [x] Google Sheet linklendirildi ← Buraya ✅ koy
- [ ] Form link'i gönderildi
```

---

### **7️⃣ Şirkete Form Gönder**

**Email Şablonu**:

```
Subject: AI Eğitimi & Danışmanlık - Hızlı Değerlendirme Formu

Merhaba [İsim],

Inflow Network olarak, şirketinizin AI yetkinliklerini artırmaya yönelik 
özelleştirilmiş eğitim ve danışmanlık hizmetleri sunuyoruz.

İlk adım olarak, takımınızın mevcut AI yetkinlik seviyesini anlamak 
için kısa bir assessment formu hazırladık.

📋 Form: [GOOGLE_FORM_LINK]
Ortalama Süre: ~10 dakika

Form yanıtları otomatik olarak kaydedilecek ve size özelleştirilmiş 
bir curriculum önerisini hazırlayacağız.

Sorularınız varsa, bana cevap vermeniz yeterli.

Başarılar,
Nihat & Giray
Inflow Network
```

---

### **8️⃣ Otomatik Senkronizasyon**

Bundan sonra hiçbir şey yapman gerekmez! 🤖

**Her gün 22:00'de**:
- Google Sheet'ten yanıtlar otomatik olarak okunuyor
- `[COMPANY]_ASSESSMENT_RESULTS.md` otomatik güncelleniyor
- GitHub'a otomatik commit yapılıyor
- AI Maturity Level otomatik hesaplanıyor
- Curriculum önerileri ekleniyor

**Kontrol etmek için**:
```bash
cd projects/sirket-adi/
cat SIRKET_ADI_ASSESSMENT_RESULTS.md
```

---

## 📊 Timeline

| Gün | Adım | Sorumlu |
|-----|------|---------|
| T+0 | Şirket ekleme (add_company.py) | Otomatik |
| T+0 | Profil araştırması | Sen |
| T+1 | Google Form & Sheet oluşturma | Sen |
| T+1 | Form link'ini gönderme | Sen |
| T+7 | İlk yanıtlar (tahmini) | Şirket |
| T+7 | Curriculum oluşturma | Otoşirket (routine) |
| T+14 | Discovery call | Sen |
| T+21 | Satış kapalı | 🎉 |

---

## 🎯 Başarı Göstergeleri

✅ Form bağlantısı README.md'de  
✅ İlk yanıt alındı  
✅ Assessment results markdown'ı otomatik güncellendi  
✅ GitHub history'de commit görünüyor  
✅ Curriculum önerileri hazır  

---

## 🆘 Sorun Giderme

### "projects klasörü bulunamadı"
```bash
# Repo root'unda olduğundan emin ol
pwd  # çıkı: /Users/nihat/DevS/ai-next olmalı
cd /Users/nihat/DevS/ai-next
```

### "Git commit başarısız"
```bash
# Git'in kurulu olduğundan emin ol
git --version
# Repo'da .git klasörü var mı kontrol et
ls -la | grep .git
```

### "Google Form linki çalışmıyor"
```bash
# URL'nin tam ve doğru olduğundan emin ol
# Ejemplo: https://docs.google.com/forms/d/FORM_ID/edit
# Spaces yok, copy-paste düzgün yap
```

### "Otomatik sync çalışmıyor"
```bash
# Scheduled routine'in çalıştığından emin ol
# Claude Sidebar'dan "Scheduled" → "infinia-gsheet-sync"
# → "Run now" tuşuna tıkla (test için)
```

---

## 🚀 Gelişmiş İpuçları

### **Birden Fazla Şirket Ekleme**

```bash
# Toplu ekle
python scripts/add_company.py --name "Şirket 1" --url "https://sirket1.com"
python scripts/add_company.py --name "Şirket 2" --url "https://sirket2.com"
python scripts/add_company.py --name "Şirket 3" --url "https://sirket3.com"

# Git history'de hepsi görülür
git log --oneline | head -5
```

### **Dosyaları Toplu Düzenle**

```bash
# Tüm şirketlerin STATUS.md'lerini kontrol et
find projects -name "STATUS.md" -exec cat {} \;

# Tüm şirketlerin README'lerini aç (MacOS)
find projects -name "README.md" -exec open {} \;
```

### **Sheet'i Manuel Senkronize Etme**

```bash
# Claude tarafında
# → Claude Sidebar
# → "Scheduled" sekmesi
# → "infinia-gsheet-sync" bulunuz
# → "Run now" tuşu tıkla
```

---

## 📚 Kaynak Dosyalar

- **Bu Guide**: `QUICK_START.md`
- **Sistem Dokümantasyonu**: `COMPANY_PIPELINE_SYSTEM.md`
- **Python Script**: `scripts/add_company.py`
- **Template**: `projects/infinia/ASSESSMENT_TEMPLATE.md`
- **Örnek Proje**: `projects/infinia/`

---

## 🎓 Sonraki Öğrenme

1. **Python Script'i İnceleme**:
   ```bash
   nano scripts/add_company.py
   ```

2. **Routine'ı Anlamak**:
   - Claude Sidebar → Scheduled Tasks
   - `infinia-gsheet-sync` → detaylara bak

3. **GitHub History Kontrol**:
   ```bash
   git log --graph --oneline
   ```

---

## ✨ Özet

```
1. python scripts/add_company.py --name "Şirket" --url "https://..."
2. Profil araştırması yap
3. Google Form & Sheet oluştur
4. README'ye link ekle
5. Form link'ini gönder
6. Kendi kendine senkronizasyon olur! 🤖
```

**Hepsi bu!** 🎉

---

**Son Güncelleme**: 2026-04-24  
**İçin**: Nihat & Giray  
**Sürüm**: 1.0
