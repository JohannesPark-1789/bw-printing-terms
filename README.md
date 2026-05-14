# bw-printing-terms

> 베러웨이시스템즈 인쇄 용어 학습 PWA  
> 한국어 / 中文 / 日本語 / English (US·UK·AU) — 9개 카테고리 280개 용어

## 기능

- 📱 **PWA**: 폰 홈화면에 설치, 오프라인 동작
- 🎴 **단어카드**: 한국어 → 4개 언어 동시 학습
- 🧠 **퀴즈**: 한↔영/日/中 4지선다, 4방향 선택
- 🔍 **검색**: 어떤 언어로도 가능 (한자·병음·가나·로마자·IPA 포함)
- 📊 **학습 진도**: localStorage 저장 (기기별)
- 🇬🇧🇦🇺 **영국/호주 영어 차이** 표시 (litho, guillotine, matt, dispatch 등)

## 카테고리

| 코드 | 분야 | 개수 |
|---|---|---|
| PRC | 인쇄 공정 | 38 |
| FIN | 후가공 | 34 |
| MAT | 재료 | 40 |
| EQP | 장비 | 30 |
| QC | 품질·색관리 | 37 |
| GEN | 공통·현장 | 41 |
| PKG | 패키징 | 20 |
| DTP | 디자인·DTP | 20 |
| IDG | HP Indigo 전용 | 20 |
| **합계** | | **280** |

---

## 배포 (GitHub Pages)

### 1. GitHub에 레포 생성

레포 이름은 **`bw-printing-terms`** (또는 원하는 이름)으로.

```bash
git init
git add .
git commit -m "Initial commit: 인쇄용어 학습 PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bw-printing-terms.git
git push -u origin main
```

> **레포 이름을 다르게 쓸 경우**:  
> `vite.config.js`의 `base` 값과 `manifest.scope`, `manifest.start_url`을  
> `/your-repo-name/` 으로 함께 수정해야 함.

### 2. GitHub Pages 활성화

레포 → Settings → Pages

- **Source**: `GitHub Actions` 선택

### 3. 자동 빌드 시작

main 브랜치에 push되면 `.github/workflows/deploy.yml` 이 자동 실행.  
1~2분 후 다음 주소에서 접속:

```
https://YOUR_USERNAME.github.io/bw-printing-terms/
```

---

## 로컬 개발

```bash
# 설치
npm install

# 개발 서버
npm run dev

# 빌드 (dist/ 생성)
npm run build

# 빌드 결과 미리보기
npm run preview
```

> **로컬 개발 시**: `vite.config.js`의 `base`가 dev 환경에서 `/`로 떨어지므로 그대로 동작.

---

## 폰에 설치하기

### Android (Chrome)

1. 사이트 접속
2. 상단에 "앱으로 설치하기" 배너 → 설치
3. 홈화면에 印 아이콘 생김

### iOS (Safari)

1. Safari로 사이트 접속 (Chrome iOS는 PWA 설치 미지원)
2. 공유 버튼 → "홈 화면에 추가"
3. 홈화면에 印 아이콘 생김

### 데스크탑 (Chrome/Edge)

1. 주소창 우측 설치 아이콘 클릭
2. 또는 메뉴 → "이 사이트를 앱으로 설치"

---

## 데이터 수정

`src/data.json` 파일을 직접 편집.

각 항목 스키마:

```json
{
  "id": "PRC-001",
  "cat": "PRC",
  "ko": "인쇄",
  "ko_hanja": "印刷",
  "ko_alt": "",
  "zh": "印刷",
  "zh_pinyin": "yìnshuā",
  "ja": "印刷",
  "ja_kana": "いんさつ",
  "ja_romaji": "insatsu",
  "en_us": "printing",
  "en_ipa": "/ˈprɪn.tɪŋ/",
  "en_ko": "프린팅",
  "en_gb": "",
  "en_au": "",
  "note": "동사 to print. 상위 개념."
}
```

수정 후 git push → 자동 재배포.

---

## 기술 스택

- React 18
- Vite 5
- TailwindCSS 3
- vite-plugin-pwa (Workbox 기반)
- lucide-react (아이콘)
- Pretendard Variable (한·중·일 폰트)
- JetBrains Mono (모노스페이스)

---

*Made for BetterWay Systems · 베러웨이시스템즈*
