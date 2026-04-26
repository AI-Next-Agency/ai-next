# Fizix AI Projesi

> **Hedef**: Fizix AI'ı müşteri olarak kazanmak ve AI eğitimi sunmak

---

## 📂 Klasör Yapısı

```
fizix-ai/
├── README.md                              # Bu dosya
├── FIZIX_AI_PROFIL.md      # Şirket profili
├── ASSESSMENT_TEMPLATE.md                 # Assessment form (şablon)
├── FIZIX_AI_ASSESSMENT_RESULTS.md  # Form sonuçları (auto-generated)
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

**Live Form**: https://ai-next-agency.github.io/ai-next/projects/fizix-ai/

---

## 🔄 Otomasyonu

Bu proje in-house pipeline kullanıyor:
- Form gönderildiğinde Cloudflare Worker'a POST atar
- Worker GitHub Actions tetikler (repository_dispatch)
- Action `responses/<ts>_response.md` yazar ve `<SLUG>_ASSESSMENT_RESULTS.md` özetini günceller
- Tüm pipeline otomatik, manuel müdahale yok

---

**Proje Sahibi**: Nihat & Giray
**Başlangıç**: 2026-04-26
**Son Güncelleme**: 2026-04-26
