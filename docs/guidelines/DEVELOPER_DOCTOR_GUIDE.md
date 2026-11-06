# Huong Dan Su Dung Project Doctor (Tu Dong Kiem Tra Chat Luong Truoc PR)

Tai lieu nay huong dan thanh vien doi ngu (Developers, AI Agents, Testers) quy trinh tu kiem tra chat luong **Project Doctor** thong qua slash command `/doctor` hoac cac lenh kiem thu truc tiep truoc khi mo Pull Request.

---

## 1. Muc dich va Y nghia

Trong du an EnglishHub, cac thanh vien phat trien (Frontend, Backend, AI, DevOps) lam viec tren moi truong cuc bo va mo Pull Request (PR) vao nhanh `develop`. De dam bao:
- Nhanh `develop` luon on dinh va khong bi loi bien dich hay vo test suite.
- Khong bi tu choi PR boi cac Ruleset va CI Quality Gate tren GitHub Actions.
- Thanh vien khong co MCP van kiem soat 100% tinh trang ma nguon truoc khi gui PR cho Tester.

---

## 2. Cach thuc kich hoat

### Cach 1: Su dung Chat Slash Command trong Antigravity (Khuyen nghi)
Khi dang pair-programming hoac yeu cau agent kiem tra ma nguon, go truc tiep trong o chat:
```text
/doctor
```
Agent se tu dong doc cac file da thay doi, chay bo kiem tra phu hop cho tung thanh phan va bao cao bang diem Scorecard truc tiep.

### Cach 2: Chay truc tiep bang Terminal Command
Mo Terminal tai thu muc goc cua du an va chay cac bo kiem tra tuong ung:

```bash
# 1. Kiem tra quy uoc Git (nhanh va commit message)
git rev-parse --abbrev-ref HEAD
git status --porcelain

# 2. Kiem tra Frontend (trong thu muc frontend/)
cd frontend
npm run test:ui:types    # Kiem tra TypeScript compile
npm run lint             # Kiem tra ESLint
npm run test:ui          # Chay Vitest test suite

# 3. Kiem tra Backend (trong thu muc backend/)
cd backend
./gradlew classes        # Bien dich Java/Kotlin
./gradlew test           # Chay JUnit test suite

# 4. Kiem tra AI Service (trong thu muc ai-service/)
cd ai-service
pytest tests/ -q
```

---

## 3. Cac tieu chi kiem tra trong Scorecard

Bang diem Project Doctor danh gia cac hang muc sau:

| Hang muc | Lenh thuc thi | Yeu cau vuot qua |
| :--- | :--- | :--- |
| **Git Branch Naming** | `git rev-parse --abbrev-ref HEAD` | Nhanh phai theo chuan `feature/ROLE-NUM-slug`, `fix/ROLE-NUM-slug`, `develop`, `staging`, `main`, hoac `docs/slug`. |
| **Git Working Tree** | `git status --porcelain` | Canh bao neu co tep chua duoc quan ly hoac commit chua dong bo. |
| **Commit Message** | `git log -1` | Tuan thu Conventional Commits: `type(ROLE-NUM): mo ta`. |
| **Frontend Types** | `npm run test:ui:types` | Khong co loi TypeScript compilation nao trong `frontend/`. |
| **Frontend ESLint** | `npm run lint` | 0 loi lint theo config ESLint cua du an. |
| **Frontend Tests** | `npm run test:ui` | Toan bo test Vitest phai pass, do phu bao cao > 80%. |
| **Backend Compile** | `./gradlew classes` | Java/Kotlin source code bien dich thanh cong. |
| **Backend Tests** | `./gradlew test` | Toan bo Unit/Integration tests cua Spring Boot phai vuot qua. |
| **AI Service Tests**| `pytest tests/` | Cac endpoint FastAPI va module AI mock chay on dinh. |

---

## 4. Huong dan xu ly loi pho bien (Troubleshooting)

### 4.1. Loi `[FAIL] Git Branch Naming`
- **Nguyen nhan**: Ten nhanh hien tai khong dung quy uoc du an (vi du: `my-feature`, `test-branch`).
- **Cach khac phuc**:
  Doi ten nhanh theo quy uoc:
  ```bash
  git branch -m feature/FE-84-teacher-studio-audio
  # hoac
  git branch -m fix/BE-74-auth-token-validation
  ```

### 4.2. Loi `[FAIL] Frontend Type Check`
- **Nguyen nhan**: Khong khop kieu TypeScript giua component va API DTO.
- **Cach khac phuc**:
  Chay cuc bo trong thu muc `frontend/`:
  ```bash
  cd frontend
  npm run test:ui:types
  ```
  Doc log va sua cac loi kieu truoc khi mo PR.

### 4.3. Loi `[FAIL] Frontend ESLint`
- **Nguyen nhan**: Cac import chua dung, unused variables hoac khong dung hooks React 19.
- **Cach khac phuc**:
  Chay tu dong sua loi format/lint:
  ```bash
  cd frontend
  npm run lint -- --fix
  ```

### 4.4. Loi `[FAIL] Backend Gradle Tests`
- **Nguyen nhan**: Mot test case bi fail do logic nghiep vu hoac du lieu mock sai.
- **Cach khac phuc**:
  Chay cuc bo trong `backend/`:
  ```bash
  cd backend
  ./gradlew test --info
  ```
  Xem bao cao chi tiet tai `backend/build/reports/tests/test/index.html`.

---

## 5. Quy dinh Definition of Done (DoD)

Khai niem Hoan thanh (DoD) cua du an EnglishHub quy dinh:
1. **Truoc khi tao Pull Request**: Developer/Agent **bat buoc** phai chay kiem tra `/doctor` va dat trang thai:
   ```text
   STATUS: READY FOR PULL REQUEST (100% QUALITY GATE COMPLIANT)
   ```
2. **Trong noi dung Pull Request**: Dinh kem ket qua kiem tra Scorecard vao phan DoD Checklist cua PR Template.
3. Khi PR duoc mo len GitHub, GitHub Actions se tu dong kich hoat Trello Bot chuyen the sang cot `Review` va thong bao cho `@Zawn-Tsu` tien hanh nghiem thu.
