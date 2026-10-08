# Kungula 🌱

**Farm smarter. Harvest more.** — *Lima n'amagezi, kungula bingi.*

Kungula (from the Luganda *okukungula*, "to harvest") is an AI-powered farm advisor, record book, marketplace and finance gateway for Ugandan farmers. This repository holds the first Android version, built from the *Kungula Product Vision, Brand & Business Blueprint v2.0*.

## Get the APK

Every push to `main` builds an installable APK automatically:

1. Open the repo's **Releases** (right side of the GitHub page) and download the latest `kungula-v1.0.N.apk` on your Android phone. (It is also attached to each run under **Actions → Build Android APK → Artifacts**.)
2. Open the downloaded file. If Android asks, allow **Install unknown apps** for your browser or Files app.
3. New versions install over the old one and keep your data.

Requires Android 7.0 (API 24) or newer.

## What's in version 1

| Module | What works now |
| --- | --- |
| **Onboarding** | Language (English, Luganda, Kiswahili), name, phone, district, village, crops & animals by icon, GPS farm location, Champion mode |
| **Jjajja** (AI advisor) | Offline advisor in English/Luganda/Kiswahili keywords: guided symptom questions, diagnoses, prices, weather, loans and a 20-topic knowledge library; reads answers aloud; escalates to human experts when unsure. Optional online AI (Claude) for open questions and photos |
| **Kungula Scan** | Photo capture + guided sign checklist across 10 crops/animals and 29 conditions (coffee wilt, leaf rust, CBD, twig borer, BXW, Fusarium, maize streak, MLN, fall armyworm, CMD, CBSD, bean rust, ALS, early/late blight, Newcastle, Gumboro, coccidiosis, ECF, lumpy skin, FMD, ASF, PPR…), confidence, urgency, treatment in local measures, pre-harvest intervals, notifiable-disease warnings, nearest verified dealer, automatic 7-day follow-up |
| **Kungula Book** | Plots (GPS boundary walking → acres), animals, vaccinations with reminders, breeding with expected birth dates, records by voice/typing ("I paid two workers 10,000 each to weed the north plot"), profit per plot/animal/season, CSV export, phone notifications |
| **Kungula Weather** | 14-day farm-level forecast (Open-Meteo), cached for offline, turned into actions ("rain in 48 h — don't spray") |
| **Kungula Market** | Prices across 9 markets with charts and store-or-sell advice, produce listings with photos shared to WhatsApp/SMS, buyer directory |
| **Kungula Duka** | Verified-dealer catalogue, price comparison, authenticity check, cart, boda/pick-up, MoMo/Airtel/cash, order tracking |
| **Kungula Finance** | Explainable Loan Readiness Score (0–100) from the farmer's own records, consent control, partner loan/insurance applications with full cost in shillings, savings goals |
| **Kungula Academy** | 10 lessons (safe spraying, coffee, fall armyworm, BXW, poultry, dairy, storage, records, loans, EUDR) with audio, quizzes and shareable certificates that raise the loan score |
| **Kungula Trace** | EUDR plot registration and mapping (polygon or point), green/amber/red status, consent, lots with QR codes, GeoJSON/CSV export for exporters |
| **Kungula Co-op** | Member register, collection-day weighing with SMS receipts, payouts list, bulk-sale progress vs buyer minimums |
| **Community** | Groups, posts with photos, replies with Jjajja-suggested answers, events, Champions |
| **Settings** | Language, larger text, voice, consent toggles, backup/restore, delete data, optional AI key |

### New in 1.1

- **New look** with light, dark and "like my phone" themes; illustrated farm scenes that follow the time of day (night sky in dark mode).
- **Opening animation** (a sprouting plant, hatching chick, grazing cow or sunrise) each time the app opens.
- **Grow your plant:** every record, plot, scan, lesson or review waters the farmer's plant with a watering-can animation. XP, 8 growth levels, daily streaks and 10 badges. Both can be switched off in Settings.
- **Scan reads photos:** on-device colour analysis finds yellowing, brown/dead tissue, orange rust powder, white mould, purple colouring, spots, streaks and mosaic; highlights them on the photo; pre-ticks the matching signs; warns about dark or blurry photos. Camera permission errors are explained. Uses the newer Capacitor camera API.
- **Roles:** sign up as Farmer, Investor or Learner (any combination). Navigation and Home change with the role.
- **Profiles:** photo, contacts (phone, WhatsApp, email), bio, farm details, stats, level and badges; share profile.
- **Kungula Invest:** verified-farm marketplace, public farmer profiles with verification checklist (ID, land documents, GPS boundary, animal count, LC1 reference, mobile money name, photos), trust score, star ratings and "genuine" reviews, follow farms, update timelines, crop and livestock opportunities with bad/expected/good-season projections, invest flow that is blocked until a farm is verified, portfolio with your animals' live (demo) heart rate and temperature, crop greenness chart. Farmers can request a verification visit, list their farm, and post photo updates.
- **Farming library** for non-farmers: guides by topic including how farm investing works, risks and verification, plus the disease guide.

### Honest limits of 1.x (and what comes next)

- **No server yet.** Everything is stored on the phone (offline-first). Community posts, listings and Co-op data stay on the device until the Kungula backend (PostgreSQL/PostGIS + sync) is built.
- **Sample data.** Market prices come from a seasonal model; dealers, buyers, Champions and finance partners are clearly marked *demo*. Orders, payments and loan applications are simulated — no money moves.
- **Scan** diagnoses from the signs the farmer ticks. The on-device image model (TensorFlow Lite, trained on Ugandan field photos) is the next milestone; photos are already captured and, with consent, can be donated for training. With an online AI key, photos get an AI second opinion.
- **Voice:** answers are read aloud with the phone's text-to-speech; questions are spoken through the keyboard's microphone. Ugandan-language speech (e.g. Sunbird AI) needs the server.
- **USSD, SMS and the voice line** run on the server side (Africa's Talking) and are not part of the app.
- **Translations** of Luganda and Kiswahili are drafts for native-speaker review; Luo and Runyankore are next.
- All agronomic and veterinary content must be reviewed by the Head of Agronomy and a vet before public launch.

## Develop

```bash
npm install
npm run dev          # open http://localhost:5173 in a browser (phone-sized window)
npm test             # unit tests (parser, diagnosis, score, Jjajja, geo, prices)
npm run build        # production web build into dist/
npx cap sync android # copy into the Android project
```

To build the APK on your own computer you need Android Studio (or the Android SDK) and JDK 21:

```bash
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Stack: React 19 + TypeScript + Vite, Capacitor 8 (camera, GPS, notifications, share, files, text-to-speech), Zustand with on-device persistence.

```
src/
  screens/      one file per screen (Home, Jjajja, Scan, Farm, Market, Duka, Finance, Academy, Trace, Coop, …)
  components/   shared UI (BoundaryWalker for GPS mapping, ConditionDetail, ui.tsx)
  data/         conditions & symptoms, knowledge library, lessons, markets, catalogue
  lib/          store, Jjajja engine, diagnosis, loan score, voice-record parser, weather, native wrappers
android/        Capacitor Android project
```

## Signing

Pilot APKs are signed with a shared test key (`android/app/kungula-pilot.keystore`) so updates install over each other. **Before publishing to Google Play**, create a private key and add these repository secrets — the workflow will use it automatically:

`KUNGULA_KEYSTORE_BASE64` (the keystore file, base64), `KUNGULA_KEYSTORE_PASSWORD`, `KUNGULA_KEY_ALIAS`, `KUNGULA_KEY_PASSWORD`.

(Switching keys means testers uninstall the pilot app once.)

## Privacy

The farmer owns their data. Nothing is shared with lenders, buyers, researchers or government unless the farmer switches it on, and every consent can be withdrawn. Designed to support compliance with Uganda's Data Protection and Privacy Act, 2019.
