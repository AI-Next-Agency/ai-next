#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Yeni bir şirket ekler ve otomatik onboarding pipeline'ı başlatır.

Usage:
    python scripts/add_company.py --name "Infinia" --url "https://infinia.com.tr"
    python scripts/add_company.py --name "Boğaziçi Yazılım" --url "https://bogazi.com"
"""

import os
import re
import sys
import argparse
from pathlib import Path
from datetime import datetime
import subprocess
import json

DEFAULT_WORKER_URL = "https://form-submission.inflownetwork.com"
REPO_ROOT = Path(__file__).resolve().parent.parent

def slugify(name):
    s = name.lower()
    for a, b in (("ş","s"),("ç","c"),("ğ","g"),("ı","i"),("ü","u"),("ö","o")):
        s = s.replace(a, b)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    if not re.fullmatch(r"[a-z0-9-]{1,50}", s):
        raise ValueError(f"slug {s!r} doesn't match required pattern [a-z0-9-]{{1,50}}")
    return s

def create_company_folder(company_name):
    """Şirket klasörünü oluştur"""
    company_slug = slugify(company_name)
    company_path = Path("projects") / company_slug
    company_path.mkdir(parents=True, exist_ok=True)
    return company_path, company_slug

def render_form(company_path, company_slug, company_name, worker_url, questions_path):
    """Render templates/assessment-form.html.tmpl into projects/<slug>/form.html
    and docs/projects/<slug>/index.html (for GitHub Pages)."""
    template_path = REPO_ROOT / "templates" / "assessment-form.html.tmpl"
    template = template_path.read_text()
    questions = json.loads(questions_path.read_text())
    if not isinstance(questions, list) or not questions:
        raise ValueError("questions JSON must be a non-empty array")

    rendered = (template
        .replace("{{COMPANY_NAME}}", company_name)
        .replace("{{COMPANY_SLUG}}", company_slug)
        .replace("{{WORKER_URL}}", worker_url)
        .replace("{{QUESTIONS_JSON}}", json.dumps(questions))
    )

    form_path = company_path / "form.html"
    form_path.write_text(rendered)

    pages_dir = REPO_ROOT / "docs" / "projects" / company_slug
    pages_dir.mkdir(parents=True, exist_ok=True)
    (pages_dir / "index.html").write_text(rendered)
    return form_path, pages_dir / "index.html"

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

## 📋 Important Links

**Live Form**: https://ai-next-agency.github.io/ai-next/projects/{company_slug}/

---

## 🔄 Otomasyonu

Bu proje in-house pipeline kullanıyor:
- Form gönderildiğinde Cloudflare Worker'a POST atar
- Worker GitHub Actions tetikler (repository_dispatch)
- Action `responses/<ts>_response.md` yazar ve `<SLUG>_ASSESSMENT_RESULTS.md` özetini günceller
- Tüm pipeline otomatik, manuel müdahale yok

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
- [x] HTML form üretildi (form.html + docs/projects/<slug>/index.html)
- [ ] GitHub'a push edildi (Pages otomatik servis edecek)
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
3. **Soruları Özelleştir**: Gerekirse `templates/default-questions.json`'dan kopyalayıp şirkete özel hale getir, yeniden render et
4. **Push**: `git push` — GitHub Pages otomatik yayına alır
5. **İletişim**: {company_name}'ye form link'ini gönder (https://ai-next-agency.github.io/ai-next/projects/<slug>/)

### ARDINDAN (Responses başladıktan sonra)
6. **Otomatik Akış**: Her gönderim Cloudflare Worker → GitHub Action üzerinden `responses/` klasörüne düşer
7. **Analiz**: Assessment sonuçlarını analiz et
8. **Curriculum**: Kişiselleştirilmiş curriculum öner
9. **Pitch**: Kurucularla discovery call planla

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
            ["git", "add", f"projects/{company_slug}/", f"docs/projects/{company_slug}/"],
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
    parser.add_argument("--questions", default=str(REPO_ROOT / "templates" / "default-questions.json"),
                        help="Path to questions JSON (default: templates/default-questions.json)")
    parser.add_argument("--worker-url", default=DEFAULT_WORKER_URL,
                        help=f"Cloudflare Worker submission endpoint (default: {DEFAULT_WORKER_URL})")
    parser.add_argument("--no-commit", action="store_true", help="Skip git commit")

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

        # Adım 7: HTML formu render et
        form_path, pages_path = render_form(
            company_path, company_slug, args.name,
            args.worker_url, Path(args.questions),
        )
        print(f"   ✅ Form üretildi: {form_path}")
        print(f"   ✅ GitHub Pages kopyası: {pages_path.relative_to(REPO_ROOT)}")

        # Adım 8: Git commit
        if not args.no_commit:
            git_commit(company_slug)

        profile_filename = f"{args.name.upper().replace(' ', '_')}_PROFIL.md"

        print(f"""
╔═══════════════════════════════════════════════════════════╗
║  ✅ {args.name} Onboarding Tamamlandı!                   ║
╚═══════════════════════════════════════════════════════════╝

📂 Proje Lokasyonu: projects/{company_slug}/

📋 Hemen Yapılması Gerekenler:
   1. {company_slug}/{profile_filename} açıp araştırmaları yap
   2. (Opsiyonel) Sorular özelse: templates/default-questions.json'dan kopyala, düzenle, --questions ile yeniden çalıştır
   3. git push  →  GitHub Pages otomatik yayına alır
   4. Form URL: https://ai-next-agency.github.io/ai-next/projects/{company_slug}/
   5. {company_slug}/STATUS.md'yi güncelle, link'i şirkete gönder

💡 İpuçları:
   - Form gönderildiğinde Cloudflare Worker → GitHub Action → projects/{company_slug}/responses/ otomatik akar
   - Sıfır manuel müdahale; özet dosyası her gönderim sonrası güncellenir

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
