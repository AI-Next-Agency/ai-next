#!/usr/bin/env python3
"""
Yeni bir şirket ekler ve otomatik onboarding pipeline'ı başlatır.

Usage:
    python scripts/add_company.py --name "Infinia" --url "https://infinia.com.tr"
    python scripts/add_company.py --name "Boğaziçi Yazılım" --url "https://bogazi.com"
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime
import subprocess
import json

def create_company_folder(company_name):
    """Şirket klasörünü oluştur"""
    company_slug = company_name.lower().replace(" ", "-").replace("ş", "s").replace("ç", "c").replace("ğ", "g").replace("ı", "i").replace("ü", "u").replace("ö", "o")
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
| **Lokasyon** | TBD |

## 🔍 Araştırma Durumu

- [ ] Web sitesi analiz edildi
- [ ] Sosyal medya profilleri bulundu
- [ ] LinkedIn profili incelendi
- [ ] Endüstri pozisyonu belirlendi
- [ ] Ana iş kolları tanımlandı
- [ ] Teknoloji stack belirlendy

## 🎯 İş Kolları & Hizmetler

*Şirket araştırması tamamlandıktan sonra doldurulacak*

## 💼 Potansiyel Ortaklık Alanları

*Assessment formu yanıtlandıktan sonra belirlenecek*

## 📊 Rakip Analizi

*Bilan hangileri?*

## 🔗 Kaynaklar

- [Website]({company_url})
- LinkedIn: *TBD*
- Diğer: *TBD*

---

**Oluşturulma Tarihi**: {datetime.now().strftime('%Y-%m-%d')}
**Durum**: 🔄 Hazırlık Aşamasında
**Son Güncelleme**: {datetime.now().strftime('%Y-%m-%d')}
"""

    profile_filename = f"{company_name.upper().replace(' ', '_')}_PROFIL.md"
    profile_path = company_path / profile_filename
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
├── README.md                              # Bu dosya
├── {company_name.upper().replace(' ', '_')}_PROFIL.md      # Şirket profili
├── ASSESSMENT_TEMPLATE.md                 # Assessment form (şablon)
├── {company_name.upper().replace(' ', '_')}_ASSESSMENT_RESULTS.md  # Form sonuçları (auto-generated)
├── STATUS.md                              # Proje durumu
└── notes/                                 # Toplantı notları (gelecek)
```

---

## 🎯 Proje Aşamaları

- [ ] Şirket profili tamamlandı
- [ ] Assessment formu oluşturuldu
- [ ] Form link'i gönderildi
- [ ] Yanıtlar alınmaya başlandı
- [ ] Curriculum önerileri hazırlandı
- [ ] Satış kapalı

---

## 📋 İmportant Links

**Google Form**: *TBD - Links'i ekle*
**Google Sheet**: *TBD - Links'i ekle*

---

## 🔄 Otomasyonu

Bu proje **otomatik senkronizasyon** kullanıyor:
- Google Sheet'ten yanıtlar otomatik olarak alınıyor
- Her gün markdown'a dönüştürülüyor
- GitHub'a otomatik commit yapılıyor

---

**Proje Sahibi**: Nihat & Giray
**Başlangıç**: {datetime.now().strftime('%Y-%m-%d')}
**Son Güncelleme**: {datetime.now().strftime('%Y-%m-%d')}
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
- [x] Assessment template kopyalandı
- [ ] Google Form oluşturuldu
- [ ] Google Sheet linklendirildi
- [ ] Form link'i gönderildi

---

## 🚀 Sonraki Adımlar

### HEMEN YAPILACAK (Bu Gün)
1. **Şirket Araştırması**: {company_name} hakkında derinlemesine araştırma yap
   - Website'i analiz et
   - LinkedIn'i kontrol et
   - Endüstri pozisyonunu belirle

2. **Profil Tamamla**: {company_name}_PROFIL.md'yi güncelle

### SONRA YAPILACAK (1-2 Gün)
3. **Google Form**: Assessment formunu Google Forms'ta oluştur
4. **Google Sheet**: Form responses'ları toplayan sheet oluştur
5. **Link'leri Ekle**: README.md'ye form ve sheet URL'lerini ekle
6. **İletişim**: {company_name}'ye form link'ini gönder

### ARDINDAN (Responses başladıktan sonra)
7. **Senkronizasyon**: Günlük rutine devrededen sheet'i senkronize et
8. **Analiz**: Assessment sonuçlarını analiz et
9. **Curriculum**: Kişiselleştirilmiş curriculum öner
10. **Pitch**: Kurucularla discovery call planla

---

## 📊 Timeline

- **Profil Tamamlanması**: T+1 gün
- **Form Gönderme**: T+2 gün
- **İlk Yanıtlar**: T+7 gün (tahmini)
- **Curriculum Hazırlığı**: T+14 gün
- **Sales Meeting**: T+21 gün

---

## 🔗 Kaynaklar

- [Ana README](../../README.md)
- [Company Pipeline System](../../COMPANY_PIPELINE_SYSTEM.md)
- [Assessment Template](./ASSESSMENT_TEMPLATE.md)

---

**Son Güncelleme**: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}
"""

    status_path = company_path / "STATUS.md"
    status_path.write_text(status_content)
    return status_path

def create_notes_folder(company_path):
    """Notes klasörünü oluştur"""
    notes_path = company_path / "notes"
    notes_path.mkdir(exist_ok=True)

    # .gitkeep dosyası ekle
    gitkeep = notes_path / ".gitkeep"
    gitkeep.write_text("")

    return notes_path

def git_commit(company_slug):
    """Git'e commit et"""
    try:
        subprocess.run(
            ["git", "add", f"projects/{company_slug}/"],
            check=True,
            capture_output=True
        )
        subprocess.run(
            ["git", "commit", "-m", f"feat: Add {company_slug} company onboarding\n\n- Created company profile\n- Added assessment template\n- Set up project structure\n- Ready for form and sheet linkage"],
            check=True,
            capture_output=True
        )
        print(f"✅ Git commit: {company_slug}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Git commit başarısız: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(
        description="🚀 Yeni bir şirket ekler ve onboarding pipeline'ı başlatır",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Örnekler:
  python scripts/add_company.py --name "Infinia" --url "https://infinia.com.tr"
  python scripts/add_company.py --name "Boğaziçi Yazılım" --url "https://bogazi.com"
        """
    )
    parser.add_argument("--name", required=True, help="Şirket adı")
    parser.add_argument("--url", default="", help="Şirket web sitesi URL'si (opsiyonel)")

    args = parser.parse_args()

    # Kontrol et: projects klasörü var mı?
    if not Path("projects").exists():
        print("❌ Hata: 'projects' klasörü bulunamadı. Lütfen repo root'unda çalıştır.")
        sys.exit(1)

    print(f"\n🚀 {args.name} için onboarding pipeline başlatılıyor...\n")

    try:
        # Adım 1: Klasör oluştur
        company_path, company_slug = create_company_folder(args.name)
        print(f"   ✅ Klasör oluşturuldu: projects/{company_slug}/")

        # Adım 2: Profil oluştur
        profile_path = create_company_profile(company_path, args.name, args.url)
        print(f"   ✅ Profil oluşturuldu: {profile_path.name}")

        # Adım 3: README oluştur
        readme_path = create_readme(company_path, args.name, company_slug)
        print(f"   ✅ README oluşturuldu: README.md")

        # Adım 4: Assessment template kopyala
        assessment_path = create_assessment_template(company_path)
        if assessment_path:
            print(f"   ✅ Assessment template kopyalandı: ASSESSMENT_TEMPLATE.md")

        # Adım 5: Status dosyası oluştur
        status_path = create_status_file(company_path, args.name)
        print(f"   ✅ Status dosyası oluşturuldu: STATUS.md")

        # Adım 6: Notes klasörü oluştur
        notes_path = create_notes_folder(company_path)
        print(f"   ✅ Notes klasörü oluşturuldu: notes/")

        # Adım 7: Git commit
        git_commit(company_slug)

        print(f"""
╔═══════════════════════════════════════════════════════════╗
║  ✅ {args.name} Onboarding Tamamlandı!                   ║
╚═══════════════════════════════════════════════════════════╝

📂 Proje Lokasyonu: projects/{company_slug}/

📋 Hemen Yapılması Gerekenler:
   1. {company_slug}/{company_name.upper().replace(' ', '_')}_PROFIL.md açıp araştırmaları yap
   2. Google Forms'ta Assessment formu oluştur
   3. Google Sheet'te response collector oluştur
   4. {company_slug}/README.md'ye form & sheet URL'lerini ekle
   5. {company_slug}/STATUS.md'yi güncelle

💡 İpuçları:
   - ASSESSMENT_TEMPLATE.md'yi Google Forms için şablon olarak kullan
   - Her şeyi git tracked tutuyoruz (otomatik commit yaptık)
   - Günlük sync routine tüm şirketleri otomatik senkronize edecek

🔄 Sonraki Komutlar:
   cd projects/{company_slug}/
   cat README.md
   cat STATUS.md

📚 Daha fazla bilgi:
   cat COMPANY_PIPELINE_SYSTEM.md

""")

        return 0

    except Exception as e:
        print(f"\n❌ Hata: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
