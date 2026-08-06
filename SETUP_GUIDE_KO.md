# Cellpinda Global Index 설정 가이드

이 가이드는 개발 지식이 없는 사용자가 **Google Drive에 파일을 추가하는 것만으로** 웹 인덱스를 갱신할 수 있도록 최초 1회 연결하는 절차입니다. 반드시 1단계부터 순서대로 진행합니다.

## 1단계 — GitHub 저장소 쓰기 권한 확인

대상 저장소: `KRAdavid/cellpinda-global-importer-index`

ChatGPT의 GitHub 연결 또는 GitHub App이 다음 권한을 가져야 합니다.

- Repository contents: Read and write
- Pull requests: Read and write
- Actions: Read and write
- Metadata: Read-only

특정 저장소만 허용할 경우 `cellpinda-global-importer-index`를 선택합니다. 저장소를 읽을 수 있어도 Contents 쓰기 권한이 빠져 있으면 브랜치 생성·파일 작성이 `403 Resource not accessible by integration`으로 실패합니다.

**완료 기준:** 별도 브랜치에 파일을 쓰고 Pull Request를 만들 수 있습니다.

---

## 2단계 — Google Drive 최상위 폴더 만들기

Google Drive에서 다음 이름으로 폴더를 만듭니다.

`Cellpinda Global Data Room`

그 아래에 [DRIVE_STRUCTURE.md](./DRIVE_STRUCTURE.md)의 폴더 구조를 그대로 만듭니다.

**완료 기준:** `01_Product`부터 `99_Archive`까지 최상위 하위 폴더가 보입니다.

---

## 3단계 — Google Cloud에서 Drive API 켜기

1. Google Cloud Console에서 새 프로젝트를 만듭니다.
2. **APIs & Services → Library**로 이동합니다.
3. **Google Drive API**를 검색합니다.
4. **Enable**을 누릅니다.

**완료 기준:** Google Drive API 상태가 Enabled입니다.

---

## 4단계 — 읽기 전용 서비스 계정 만들기

1. **IAM & Admin → Service Accounts**로 이동합니다.
2. **Create service account**를 누릅니다.
3. 이름 예시: `cellpinda-drive-index-reader`
4. 프로젝트 역할은 추가하지 않아도 됩니다. Drive 폴더 공유 권한으로만 읽게 합니다.
5. 생성한 서비스 계정에서 **Keys → Add key → Create new key → JSON**을 선택합니다.
6. JSON 파일을 안전하게 보관합니다.

JSON 파일은 GitHub 코드, Google Drive 또는 이메일에 올리지 않습니다.

**완료 기준:** 서비스 계정 이메일과 JSON 키 파일을 보유합니다.

---

## 5단계 — Data Room을 서비스 계정과 공유하기

1. Google Drive의 `Cellpinda Global Data Room` 폴더에서 **공유**를 엽니다.
2. 4단계의 서비스 계정 이메일을 추가합니다.
3. 권한은 **뷰어(Viewer)**로 설정합니다.

서비스 계정에는 편집 권한이 필요하지 않습니다.

**완료 기준:** 서비스 계정 이메일이 최상위 폴더의 Viewer로 표시됩니다.

---

## 6단계 — 공개할 파일만 공개 설정하기

웹 인덱스에는 `링크가 있는 모든 사용자(Anyone with the link) → 뷰어` 권한이 확인된 파일만 포함됩니다.

1. 공개하려는 파일 또는 공개 폴더의 **공유**를 엽니다.
2. 일반 액세스를 **링크가 있는 모든 사용자**로 변경합니다.
3. 권한은 **뷰어**로 설정합니다.
4. 비공개 자료, 고객 기밀, 계약서 원본, 개인정보 포함 자료는 공개하지 않습니다.

**완료 기준:** 시크릿 브라우저에서 해당 링크가 로그인 없이 열립니다.

---

## 7단계 — Drive 최상위 폴더 ID 확인하기

최상위 폴더를 브라우저에서 열면 주소에 다음 형태가 보입니다.

```text
https://drive.google.com/drive/folders/여기가_폴더_ID
```

`folders/` 뒤의 문자열만 복사합니다.

**완료 기준:** `Cellpinda Global Data Room`의 폴더 ID를 확보합니다.

---

## 8단계 — GitHub Actions Secret 두 개 등록하기

GitHub 저장소에서 **Settings → Secrets and variables → Actions**로 이동합니다.

### Secret 1

- Name: `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- Secret: 7단계에서 복사한 폴더 ID

### Secret 2

- Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
- Secret: 서비스 계정 JSON 파일의 전체 내용

JSON 내용은 첫 `{`부터 마지막 `}`까지 통째로 붙여 넣습니다.

**완료 기준:** 두 Secret 이름이 Repository secrets 목록에 표시됩니다. Secret 값은 다시 표시되지 않는 것이 정상입니다.

---

## 9단계 — GitHub Actions의 Pull Request 생성 허용하기

저장소의 **Settings → Actions → General**로 이동합니다.

Workflow permissions에서 다음을 확인합니다.

- **Read and write permissions** 선택
- **Allow GitHub Actions to create and approve pull requests** 활성화

**완료 기준:** 자동화 워크플로가 `automation/google-drive-index` 브랜치와 Pull Request를 만들 수 있습니다.

---

## 10단계 — 첫 수동 동기화 실행하기

1. 저장소의 **Actions** 탭을 엽니다.
2. **Sync Google Drive Index**를 선택합니다.
3. **Run workflow**를 누릅니다.
4. 첫 실행에서는 링크 검증 옵션을 끈 상태로 시작합니다.
5. 실행이 성공하면 자동 Pull Request가 생성됩니다.

자동화는 다음을 순서대로 수행합니다.

1. Drive 폴더 재귀 탐색
2. 공개 파일만 선별
3. 분류와 메타데이터 생성
4. 만료 자료 Archive 처리
5. JSON 검증
6. 정적 웹 빌드
7. 자동화 브랜치 커밋
8. Pull Request 생성 또는 갱신

**완료 기준:** Actions 실행이 초록색으로 완료되고, `chore: sync public Google Drive index` Pull Request가 열립니다.

---

## 11단계 — 자동 병합 선택하기

검토 후 수동으로 병합하려면 아무 설정도 하지 않습니다.

완전 자동 반영을 사용하려면 **Settings → Secrets and variables → Actions → Variables**에 다음 Repository variable을 추가합니다.

- Name: `AUTO_MERGE_DRIVE_INDEX`
- Value: `true`

브랜치 보호 규칙이 있는 경우 필수 검사 통과 후 병합됩니다. 브랜치 보호가 없으면 동기화 워크플로의 빌드 검증 후 병합될 수 있습니다.

**완료 기준:** Drive 변경 → 자동 PR → main 병합 → 배포 갱신 흐름이 작동합니다.

---

## 12단계 — 선택 사항: OpenAI 자동 요약 연결하기

OpenAI 연결은 필수가 아닙니다. 키가 없으면 폴더·파일명·Drive 설명 기반 규칙으로 안전하게 동작합니다.

사용할 경우 Repository secret을 추가합니다.

- Name: `OPENAI_API_KEY`
- Secret: OpenAI API key

선택 변수:

- `OPENAI_MODEL`: 기본값 `gpt-5-mini`
- `OPENAI_MAX_DOCUMENTS`: 한 실행에서 보조 처리할 최대 문서 수, 기본값 `20`

AI는 파일 원문을 업로드하지 않고 제목·경로·기존 메타데이터를 바탕으로 중립적 탐색 요약과 태그만 보조합니다. 규제 승인, 효능, 수입 가능 여부를 생성하도록 허용하지 않습니다.

---

## 13단계 — 배포 연결하기

[Vercel 또는 Cloudflare Pages 배포 절차](./DEPLOYMENT.md)를 따릅니다.

배포 빌드 설정:

- Build command: `npm run build`
- Output directory: `out`
- Node.js: 24

**완료 기준:** main 브랜치가 병합될 때 공개 웹 주소가 자동 갱신됩니다.

---

## 이후 사용자가 하는 일

최초 설정 후에는 다음 세 가지만 하면 됩니다.

1. 알맞은 Drive 폴더에 공개 파일을 추가합니다.
2. 필요하면 파일 **설명(Description)**에 메타데이터를 입력합니다.
3. 다음 일일 실행 또는 수동 실행 후 웹 반영 상태를 확인합니다.

코드 수정은 필요하지 않습니다.

## 문제 발생 시 가장 먼저 확인할 항목

| 현상 | 확인할 내용 |
|---|---|
| 파일이 인덱스에 없음 | 파일이 로그인 없이 공개되는지 확인 |
| Drive API 403 | 서비스 계정이 최상위 폴더 Viewer인지 확인 |
| GitHub Contents 403 | GitHub App에 Contents read/write 권한과 저장소 설치 범위가 있는지 확인 |
| PR 생성 실패 | Actions의 PR 생성 허용 설정 확인 |
| 자료가 Archive로 이동 | `expiryDate`와 파일 설명의 `status` 확인 |
| 요약이 단순함 | Drive 파일 설명에 `summary`, `tags` 입력 |
| 사이트 배포가 안 됨 | 배포 서비스의 Build command와 `out` 경로 확인 |
