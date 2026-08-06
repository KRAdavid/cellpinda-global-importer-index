# Cellpinda Global Index 설정 가이드

이 문서는 개발 지식이 없는 사용자가 **기존 Google Drive에 공개 파일을 추가하는 것만으로** 웹 인덱스를 갱신하도록 최초 1회 연결하는 절차입니다.

## 현재 확정된 운영 구조

새 Google Drive를 만들지 않습니다. 다음 기존 폴더를 단일 원본으로 사용합니다.

- 폴더명: `Cellpinda Global Data Room`
- 폴더 ID: `1f7GoC25SGkIyRZa85qGdbmf0Rb0Pkde6`
- 공개 범위: `링크가 있는 모든 사용자 → 뷰어`

이 폴더 아래에 넣는 자료는 웹 공개용으로 간주합니다. 고객 기밀, 개인정보, 계약서 원본, 미공개 규제 초안, NDA 자료는 이 폴더에 넣지 않습니다.

---

## 1단계 — GitHub 연결 상태

대상 저장소:

`KRAdavid/cellpinda-global-importer-index`

현재 완료된 항목:

- GitHub App 저장소 접근
- 브랜치 생성과 파일 작성
- Pull Request 생성과 병합
- Next.js production build
- Google Drive 동기화 코드와 일일 실행 workflow

이 단계에서 사용자가 추가로 할 일은 없습니다.

---

## 2단계 — 기존 공개 Data Room 확인

Google Drive에서 `Cellpinda Global Data Room`을 엽니다.

최상위에는 다음 폴더가 있어야 합니다.

```text
01_Product
02_Manufacturing
03_Quality_Certificates
04_Scientific_Evidence
05_Regulatory
06_Patents
07_Case_Studies
08_Market_Insights
99_Archive
```

`04_Scientific_Evidence`와 `05_Regulatory` 아래에는 [DRIVE_STRUCTURE.md](./DRIVE_STRUCTURE.md)에 정의된 하위 폴더가 있습니다.

**완료 기준:** 위 폴더 구조가 기존 Data Room 안에 보입니다.

---

## 3단계 — 공개 권한 운영 원칙

`Cellpinda Global Data Room`의 일반 액세스는 다음과 같이 유지합니다.

```text
링크가 있는 모든 사용자
권한: 뷰어
```

상위 폴더의 공개 권한은 하위 폴더와 파일에 전파됩니다. 따라서 정상적인 사용 방식은 다음과 같습니다.

1. 공개할 파일을 알맞은 카테고리 폴더에 넣습니다.
2. 파일이 공개 권한을 상속했는지 확인합니다.
3. 시크릿 브라우저에서 로그인 없이 열리는지 확인합니다.

공개 Data Room 밖의 개인 Google Drive 자료는 웹 인덱스에 포함되지 않습니다.

**완료 기준:** 공개할 자료가 시크릿 브라우저에서 로그인 없이 열립니다.

---

## 4단계 — Google Cloud 프로젝트 선택

Google Drive 자체는 기존 폴더를 그대로 사용하지만, GitHub Actions가 Drive 폴더 목록을 읽으려면 Google Drive API가 활성화된 Google Cloud 프로젝트가 하나 필요합니다.

기존 Google Cloud 프로젝트가 있으면 그대로 사용합니다. 적합한 프로젝트가 없을 때만 새 프로젝트를 만듭니다.

권장 프로젝트 이름:

`Cellpinda Global Index`

**완료 기준:** 사용할 Google Cloud 프로젝트가 화면 상단에 선택되어 있습니다.

---

## 5단계 — Google Drive API 활성화

Google Cloud Console에서 다음 순서로 이동합니다.

```text
APIs & Services
→ Library
→ Google Drive API
→ Enable
```

**완료 기준:** Google Drive API 상태가 `Enabled`로 표시됩니다.

---

## 6단계 — 읽기 전용 서비스 계정 생성

Google Cloud Console에서 다음 순서로 이동합니다.

```text
IAM & Admin
→ Service Accounts
→ Create service account
```

권장 이름:

`cellpinda-drive-index-reader`

프로젝트 역할은 추가하지 않아도 됩니다. 이 서비스 계정은 Google Drive 폴더에서 부여받는 뷰어 권한만 사용합니다.

생성 후 서비스 계정 이메일을 확인합니다. 일반적으로 다음과 같은 형태입니다.

```text
cellpinda-drive-index-reader@프로젝트ID.iam.gserviceaccount.com
```

**완료 기준:** 서비스 계정 이메일이 표시됩니다.

---

## 7단계 — 기존 Data Room을 서비스 계정과 공유

Google Drive의 `Cellpinda Global Data Room`에서 **공유**를 엽니다.

1. 6단계의 서비스 계정 이메일을 입력합니다.
2. 권한을 `뷰어`로 선택합니다.
3. 공유를 완료합니다.

서비스 계정에는 편집 권한이 필요하지 않습니다.

**완료 기준:** 서비스 계정 이메일이 Data Room 공유 목록에 `뷰어`로 표시됩니다.

---

## 8단계 — 서비스 계정 JSON 키 생성

Google Cloud의 해당 서비스 계정 화면에서 다음 순서로 이동합니다.

```text
Keys
→ Add key
→ Create new key
→ JSON
```

다운로드된 JSON 파일은 인증정보입니다.

- GitHub 코드에 올리지 않습니다.
- Google Drive에 올리지 않습니다.
- 이메일이나 메신저로 전달하지 않습니다.
- 이 채팅에 붙여 넣지 않습니다.

**완료 기준:** JSON 키 파일을 안전한 로컬 위치에 보관합니다.

---

## 9단계 — GitHub Secret 한 개 등록

GitHub 저장소에서 다음 순서로 이동합니다.

```text
Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

등록할 값:

```text
Name: GOOGLE_SERVICE_ACCOUNT_JSON
Secret: JSON 파일의 첫 { 부터 마지막 } 까지 전체 내용
```

공개 Drive 루트 폴더 ID는 workflow에 이미 설정되어 있으므로 별도 Secret으로 등록하지 않습니다.

**완료 기준:** Repository secrets 목록에 `GOOGLE_SERVICE_ACCOUNT_JSON`이 보입니다. 실제 값이 다시 표시되지 않는 것은 정상입니다.

---

## 10단계 — GitHub Actions의 PR 생성 허용

저장소에서 다음 순서로 이동합니다.

```text
Settings
→ Actions
→ General
→ Workflow permissions
```

다음을 설정합니다.

- `Read and write permissions`
- `Allow GitHub Actions to create and approve pull requests`

**완료 기준:** 설정을 저장했습니다.

---

## 11단계 — 첫 수동 동기화

GitHub 저장소에서 다음 순서로 진행합니다.

```text
Actions
→ Sync Google Drive Index
→ Run workflow
```

첫 실행에서는 링크 검증 옵션을 끈 상태로 실행합니다.

자동화는 다음을 수행합니다.

1. 기존 공개 Data Room을 재귀 탐색
2. 공개 권한이 확인된 파일만 선별
3. 폴더와 파일명을 기준으로 기본 분류
4. Drive 설명의 선택 메타데이터 반영
5. 만료 자료 Archive 처리
6. `public/data/index.json`과 `status.json` 생성
7. JSON 검증과 Next.js production build
8. `automation/google-drive-index` 브랜치 업데이트
9. 동기화 Pull Request 생성 또는 갱신

**완료 기준:** Actions 실행이 초록색으로 끝나고 `chore: sync public Google Drive index` Pull Request가 열립니다.

---

## 12단계 — 자동 병합 선택

처음에는 동기화 Pull Request를 직접 확인한 뒤 병합하는 것을 권장합니다.

검증이 안정화된 후 완전 자동 반영을 사용하려면 Repository variable을 추가합니다.

```text
Name: AUTO_MERGE_DRIVE_INDEX
Value: true
```

자동 흐름:

```text
Drive 파일 추가 또는 수정
→ 매일 GitHub Actions 실행
→ 공개 인덱스 JSON 갱신
→ 자동 PR
→ 검사 통과
→ main 병합
→ 배포 자동 갱신
```

---

## 13단계 — 선택 사항: OpenAI 자동 요약

OpenAI 연결은 필수가 아닙니다. 키가 없으면 폴더·파일명·Drive 설명을 이용한 규칙 기반 분류로 작동합니다.

사용할 때만 Repository secret을 추가합니다.

```text
Name: OPENAI_API_KEY
Secret: OpenAI API key
```

선택 변수:

```text
OPENAI_MODEL=gpt-5-mini
OPENAI_MAX_DOCUMENTS=20
```

AI는 규제 승인, 제품 효능 또는 수입 가능 여부를 임의로 확정하지 않도록 제한되어 있습니다.

---

## 14단계 — 배포

[Vercel 또는 Cloudflare Pages 배포 절차](./DEPLOYMENT.md)를 따릅니다.

```text
Build command: npm run build
Output directory: out
Node.js: 24
Production branch: main
```

---

## 최초 설정 후 사용자가 하는 일

이후에는 코드 수정이 필요하지 않습니다.

1. `Cellpinda Global Data Room`의 알맞은 폴더에 공개 파일을 추가합니다.
2. 필요하면 파일 설명에 `summary`, `tags`, `country`, `issueDate`, `expiryDate` 등의 메타데이터를 입력합니다.
3. 다음 일일 실행 또는 수동 실행 후 웹 반영 상태를 확인합니다.

## 문제 발생 시 확인표

| 현상 | 확인할 내용 |
|---|---|
| 파일이 인덱스에 없음 | 파일이 공개 Data Room 안에 있고 로그인 없이 열리는지 확인 |
| Drive API 403 | Drive API 활성화와 서비스 계정의 Data Room 뷰어 권한 확인 |
| 서비스 계정 인증 실패 | GitHub Secret에 JSON 전체 내용이 정확히 들어갔는지 확인 |
| 자동 PR 생성 실패 | Actions의 Read and write 및 PR 생성 허용 설정 확인 |
| 자료가 Archive로 표시 | `expiryDate`, 파일명 날짜, Drive 설명의 `status` 확인 |
| 요약이 단순함 | Drive 파일 설명에 `summary`와 `tags` 입력 |
| 사이트 배포가 안 됨 | 배포 서비스의 빌드 명령, `out` 경로, Node.js 버전 확인 |
