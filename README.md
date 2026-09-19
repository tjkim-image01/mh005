# 04.web — 『점창여제』 전시 뷰어

정적 페이지 5장. **이 폴더 안에서 완결된다** — 바깥을 `../` 로 참조하지 않는다.

| 문서 | 무엇 |
|---|---|
| `prompts.md` | **기획.** 무엇을 왜 이렇게 보여주는가 + Stitch 입력 프롬프트 |
| `ASSETS.md` | **리소스 대장.** 어떤 파일이 어디서 오는가 |
| `DEPLOY.md` | **배포.** 별도 public 레포 → GitHub Pages |

---

## 화면

```
index.html            작품관 홈 — 히어로 · 회차(막별) · 인물 · 세계관
novel_mobile.html     소설 뷰어 (모바일)  ?ep=1
novel_pc.html         소설 뷰어 (PC)      ?ep=1
webtoon_mobile.html   웹툰 뷰어 (모바일)  ?ep=1
webtoon_pc.html       웹툰 뷰어 (PC)      ?ep=1
```

홈이 화면 폭을 보고 모바일/PC 를 고른다. `?force=pc` · `?force=mobile` 로 무시할 수 있다.

**소설이 주력이고 웹툰은 그릇이다.** 컷 이미지가 아직 0장이라(작화 전)
웹툰 뷰어는 대본 정보를 담은 '준비 중' 카드를 띄운다. 컷이 들어오면 **HTML 수정 없이** 컷 모드로 바뀐다.

---

## 실행

```bash
cd project/mh005/04.web
python3.13 tools/build_web.py     # 원고 → 데이터 (2차교정 우선, 없으면 1차교정)
python3.13 -m http.server 8777    # http://localhost:8777/
```

`file://` 로 열어도 동작한다(`fetch` 를 쓰지 않는다).

---

## 폴더

```
assets/
  css/app.css      공용 디자인 시스템 (색·바·시트·회차행)
  css/novel.css    소설 조판 · 테마 3종
  js/series_data.js  ★ 단일 진실 원천 — 작품·인물·세계관·회차
  js/novel.js        소설 로딩·설정·위치 복원
  js/reader_ui.js    뷰어 4장이 공유하는 UI 조각
  novel/epNN.js    ← 생성물. 01.story/1차교정 에서 만든다
  characters/      ← 복사본. 03.make/result 에서 가져온다
  webtoon/epNN/    ← 복사본. 작화 후 채워진다
tools/
  build_web.py     원고 → 데이터
  publish.sh       별도 레포로 배포
```

---

## 고칠 때

| 고치고 싶은 것 | 고치는 곳 |
|---|---|
| 소설 본문 | `01.story/2차교정/NN화.md` (13화 이후는 `1차교정/`) → **빌드 다시** |
| 회차 훅·절단 강도 | 같은 파일의 머리말 인용 블록 → 빌드 |
| 어느 교정본을 쓸지 | `tools/build_web.py` 의 `DEFAULT_SRC` (`ASSETS.md` §2-0) |
| 컷 수·말풍선 수 | `01.story/대본/NN화.md` 머리말 → 빌드 |
| 인물·세계관·로그라인 | `assets/js/series_data.js` (손으로) |
| 색·여백·조판 | `assets/css/` |
| 막 이름 | `series_data.js` 의 `WORK.actNames` |

`assets/novel/` 과 `series_data.js` 의 `BUILD:START~END` 구간은 **손대지 않는다.** 빌드가 덮어쓴다.

---

## 원칙 4가지

1. **원고를 HTML 에 박지 않는다.** 원본은 `01.story/`, 여기는 복제본이다.
2. **제작 노트를 내보내지 않는다.** `## 절단 메모` 이후는 빌드가 잘라낸다.
3. **회차 수를 하드코딩하지 않는다.** 원고 파일 수가 회차 수고, 10화마다 막이 생긴다.
4. **바깥을 참조하지 않는다.** 떼어 가도 돌아가야 한다.
