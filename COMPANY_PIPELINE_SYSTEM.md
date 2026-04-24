# 🤖 Otomatik Şirket Onboarding Pipeline

> **Hedef**: Yeni bir şirket ekle → Otomatik olarak profil, form, sheet ve GitHub senkronizasyonu

---

## 🎯 Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│         YENİ ŞİRKET EKLEME (Manuel Adım)                   │
│  python scripts/add_company.py --name "Şirket Adı"         │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────────┐    ┌─────────────────────┐
│ GitHub'da klasör     │    │ Şirket Profili      │
│ oluştur:             │    │ Markdown'ı          │
│ projects/[company]   │    │ Web scraping ile    │
└──────────────────────┘    │ otomatik doldur     │
                            └────────┬────────────┘
                                     │
        ┌────────────────────────────┴─────────────────┐
        │                                              │
        ▼                                              ▼
┌──────────────────────────────┐      ┌──────────────────────────┐
│ Google Form Oluştur          │      │ Google Sheet Oluştur     │
│ - Assessment template'i ile  │      │ - Form responses için    │
│ - Auto-fill sorular         │      │ - Collaboration önceden  │
│ - Shared drive'a koy        │      │ - Permissions set        │
└────────────┬─────────────────┘      └──────────┬───────────────┘
             │                                  │
             └──────────────┬───────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │ GitHub README'ya Link Ekle         │
        │ - Form URL                         │
        │ - Sheet URL                        │
        │ - Status & Next Steps              │
        └──────────────┬─────────────────────┘
                       │
                       ▼
        ┌────────────────────────────────────┐
        │ Daily Sync Routine (Claude)        │
        │ - Sheet'i oku                      │
        │ - MD dosyaya dönüştür              │
        │ - GitHub'a push et                 │
        │ - Analiz ve öneriler ekle         │
        └────────────────────────────────────┘
```

---

## 🛠️ Implementation Plan

### **Aşama 1: Python Script (add_company.py)**

```python
#!/usr/bin/env python3
"""
Yeni bir şirket ekler ve otomatik onboarding pipeline'ı başlatır.

Usage:
    python scripts/add_company.py --name "Infinia" --url "https://infinia.com.tr"
"""

import os
import json
import argparse
from pathlib import Path
from datetime import datetime
import subprocess

def create_company_folder(company_name):
    """Şirket klasörünü oluştur"""
    company_slug = company_name.lower().replace(" ", "-")
    company_path = Path("projects") / company_slug
    company_path.mkdir(parents=True, exist_ok=True)
    return company_path, company_slug

def create_company_profile(company_path, company_name, company_url):
    """Şirket profili template'ini oluştur"""
    profile_content = f"""# {company_name} Şirket Profili

## 📋 Genel Bilgi

| Kategori | Bilgi |
|----------|-------|
| **Şirket Adı** | {company_name} |
| **Web Sitesi** | {company_url} |
| **Kuruluş Yılı** | TBD |
| **Çalışan Sayısı** | TBD |

## 🔍 Araştırma Durumu

- [ ] Web sitesi analiz edildi
- [ ] Sosyal medya profilleri bulundu
- [ ] LinkedIn profili incelendi
- [ ] Endüstri pozisyonu belirlendi
- [ ] Ana iş kolları tanımlandı

## 🎯 İş Kolları & Hizmetler

*Şirket araştırması tamamlandıktan sonra doldurulacak*

## 💼 Potansiyel Ortaklık Alanları

*Assessment formu yanıtlandıktan sonra belirlenecek*

## 📚 Kaynaklar

- [Website]({company_url})
- LinkedIn: *TBD*
- Diğer: *TBD*

---

**Oluşturulma Tarihi**: {datetime.now().strftime('%Y-%m-%d')}
**Durum**: 🔄 Hazırlık Aşamasında
"""
    
    profile_path = company_path / f"{company_name.upper()}_PROFIL.md"
    profile_path.write_text(profile_content)
    return profile_path

def create_readme(company_path, company_name, company_slug):
    """README.md oluştur"""
    readme_content = f"""# {company_name} Projesi

> **Hedef**: {company_name}'ı müşteri olarak kazanmak ve AI eğitimi sunmak

---

## 📂 Klasör Yapısı

```
{company_slug}/
├── README.md                      # Bu dosya
├── {company_name.upper()}_PROFIL.md              # Şirket profili
├── ASSESSMENT_TEMPLATE.md         # Assessment form
├── {company_name.upper()}_ASSESSMENT_RESULTS.md # Form sonuçları (auto-generated)
├── STATUS.md                      # Proje durumu
└── notes/                         # Toplantı notları
```

---

## 📋 Durum Başlama

- [ ] Şirket profili tamamlandı
- [ ] Assessment formu oluşturuldu
- [ ] Form link'i gönderildi
- [ ] Yanıtlar alınmaya başlandı
- [ ] Curriculum önerileri hazırlandı
- [ ] Satış kapalı

---

## 🔗 Önemli Linkler

**Google Form**: *TBD*  
**Google Sheet**: *TBD*

---

**Proje Sahibi**: Nihat & Giray
**Başlangıç**: {datetime.now().strftime('%Y-%m-%d')}
"""
    
    readme_path = company_path / "README.md"
    readme_path.write_text(readme_content)
    return readme_path

def create_assessment_template(company_path):
    """Assessment form template'ini kopyala"""
    # Infinia template'inden kopyala
    infinia_template = Path("projects/infinia/ASSESSMENT_TEMPLATE.md")
    if infinia_template.exists():
        template_content = infinia_template.read_text()
        assessment_path = company_path / "ASSESSMENT_TEMPLATE.md"
        assessment_path.write_text(template_content)
        return assessment_path
    return None

def create_status_file(company_path, company_name):
    """STATUS.md oluştur"""
    status_content = f"""# {company_name} - Proje Durumu

**Oluşturulma**: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}
**Status**: ⏳ Başlangıç Aşaması

---

## ✅ Tamamlanan İşler

- [x] Klasör yapısı oluşturuldu
- [x] Profil template'i hazırlandı
- [x] README.md yazıldı
- [ ] Google Form oluşturuldu
- [ ] Google Sheet linklendirildi

## 🚀 Sonraki Adımlar

1. **Araştırma**: {company_name} hakkında derinlemesine araştırma yap
2. **Form**: Google Form'u oluştur ve link'i ekle
3. **İletişim**: Form link'ini {company_name}'ye gönder
4. **Senkronizasyon**: Sheet'i GitHub'a bağla
5. **Analysis**: Yanıtları al ve curriculum öner

---

**Son Güncelleme**: {datetime.now().strftime('%Y-%m-%d')}
"""
    
    status_path = company_path / "STATUS.md"
    status_path.write_text(status_content)
    return status_path

def git_commit(company_path, company_slug):
    """Git'e commit et"""
    try:
        subprocess.run(
            ["git", "add", f"projects/{company_slug}/"],
            cwd=Path.cwd(),
            check=True
        )
        subprocess.run(
            ["git", "commit", "-m", f"Add: {company_slug} company onboarding"],
            cwd=Path.cwd(),
            check=True
        )
        print(f"✅ Git commit tamamlandı: {company_slug}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Git commit başarısız: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(
        description="Yeni bir şirket ekler ve onboarding pipeline'ı başlatır"
    )
    parser.add_argument("--name", required=True, help="Şirket adı")
    parser.add_argument("--url", default="", help="Şirket web sitesi URL'si")
    
    args = parser.parse_args()
    
    print(f"🚀 {args.name} için onboarding pipeline başlatılıyor...")
    
    # Adım 1: Klasör oluştur
    company_path, company_slug = create_company_folder(args.name)
    print(f"✅ Klasör oluşturuldu: {company_path}")
    
    # Adım 2: Profil oluştur
    profile_path = create_company_profile(company_path, args.name, args.url)
    print(f"✅ Profil oluşturuldu: {profile_path}")
    
    # Adım 3: README oluştur
    readme_path = create_readme(company_path, args.name, company_slug)
    print(f"✅ README oluşturuldu: {readme_path}")
    
    # Adım 4: Assessment template kopyala
    assessment_path = create_assessment_template(company_path)
    if assessment_path:
        print(f"✅ Assessment template kopyalandı: {assessment_path}")
    
    # Adım 5: Status dosyası oluştur
    status_path = create_status_file(company_path, args.name)
    print(f"✅ Status dosyası oluşturuldu: {status_path}")
    
    # Adım 6: Git commit
    git_commit(company_path, company_slug)
    
    print(f"""
╔════════════════════════════════════════════════════╗
║  ✅ {args.name} Onboarding Tamamlandı!            ║
╚════════════════════════════════════════════════════╝

📂 Proje Lokasyonu: projects/{company_slug}/

📋 Sonraki Adımlar:
1. README.md açıp Google Form & Sheet URL'lerini ekle
2. Assessment formu Google Forms'ta oluştur
3. Form link'ini {company_slug}/README.md'ye ekle
4. Daily sync routine'ı konfigüre et

💡 İpucu:
   python scripts/add_company.py --name "YeniŞirket" --url "https://..."
""")

if __name__ == "__main__":
    main()
```

---

### **Aşama 2: Günlük Sync Routine (Claude Scheduled Task)**

Mevcut `infinia-gsheet-sync` routine'ı genelleştireceğiz:

```python
# scheduled-tasks/company-sync-routine.md

**Task**: Daily Company Assessment Sync

1. **Tüm şirketleri tara** (`projects/*/README.md`)
2. **Her şirket için**:
   - Sheet URL'sini oku
   - En son yanıtları al
   - RESULTS markdown'ını güncelle
   - GitHub'a commit et
3. **Analiz ekle**:
   - AI Maturity Level hesapla
   - Skill gaps tanımla
   - Curriculum recommendation yap
4. **Bildir**: Yeni yanıtlar varsa email/Slack gönder
```

---

### **Aşama 3: Arama & Web Scraping (Python)**

```python
# scripts/research_company.py

"""
Şirket hakkında otomatik araştırma yapar
"""

import requests
from bs4 import BeautifulSoup
import json

def research_company(company_name, company_url):
    """
    Şirket hakkında bilgi topla:
    - Website content
    - LinkedIn info
    - Founded year, employees, industry
    - Technology stack hints
    """
    
    # Bu akan API'ler kullanabilir:
    # - Clearbit API (company info)
    # - LinkedIn API (company profile)
    # - Hunter.io (email patterns)
    # - RocketReach (contact info)
    
    pass
```

---

## 📊 Execution Timeline

| Aşama | Zaman | Ürün |
|-------|-------|------|
| Script yazma | 30 min | `add_company.py` |
| Routine iyileştirme | 20 min | Günlük sync |
| Web scraping | 15 min | Auto research |
| Testing | 15 min | Test cases |
| **TOPLAM** | **80 min** | **Tam sistem** |

---

## 🎯 Sonuç: Kullanım

Bir kez setup edildikten sonra, yeni bir şirket eklemek şu kadar basit:

```bash
# 1. Şirket ekle
python scripts/add_company.py --name "Boğaziçi Yazılım" --url "https://bogazi.com.tr"

# 2. Google Form & Sheet linklerini ekle (manuel, 2 dakika)
# 3. Slack'te duyur
# 4. Her gün otomatik senkronizasyon olur!
```

---

## 📝 Detaylı Adımlar

### **Step 1: Python Script'i Git'e Ekle**
```bash
mkdir -p scripts/
# add_company.py'yi oluştur
git add scripts/
git commit -m "Add: company onboarding automation script"
```

### **Step 2: Günlük Routine'i Konfigüre Et**
```
Claude Scheduled Task:
- Task ID: company-daily-sync
- Schedule: 0 22 * * * (her gün 22:00)
- Script: Tüm şirketlerdeki sheets'i oku → markdown'a dönüştür → commit
```

### **Step 3: İlk Test**
```bash
python scripts/add_company.py --name "Test Şirket" --url "https://test.com"
# Sonra INFINIA örneğini geçir
```

---

## 🔄 System Flow (Daily)

```
00:00 - Rutine başla
  ├─ projects/*/README.md'deki tüm Sheet URL'lerini oku
  ├─ Her Sheet'i Google API ile oku
  ├─ Yeni responses varsa:
  │   ├─ *_ASSESSMENT_RESULTS.md'yi güncelle
  │   ├─ AI Maturity Level hesapla
  │   ├─ Curriculum recommendations ekle
  │   └─ GitHub'a commit et
  └─ Bildir (yeni responses varsa)
```

---

## ✨ Avantajlar

✅ **Yeni şirket ekleme**: 5 saniye (bir komut)  
✅ **Otomatik araştırma**: Web scraping ile doldur  
✅ **Form & Sheet**: Otomatik oluştur ve link'le  
✅ **Günlük senkronizasyon**: Hiçbir manuel işlem yok  
✅ **Git history**: Her değişiklik tracked  
✅ **Skallabilir**: 50 şirket olsa bile çalışır  

---

## 🚀 Başlamak İçin

Bu sistemi kurmak istiyorsan:

1. Python script'i yazacağım
2. Günlük routine'ı setup edecek
3. Infinia örneğini kullanarak test edeceğiz
4. Sen sadece komut çalıştıracaksın!

**Hazır mısın?** 🎯
