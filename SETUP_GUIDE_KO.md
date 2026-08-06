# Cellpinda Global Index 설정 가이드

이 구성은 Google Cloud Console을 사용하지 않습니다. 기존 `Cellpinda Global Data Room`을 그대로 사용하고, Google Apps Script가 공개 파일 목록을 JSON으로 제공하면 GitHub Actions가 웹 인덱스를 갱신합니다.

## 확정 원본

```text
폴더명: Cellpinda Global Data Room
폴더 ID: 1f7GoC25SGkIyRZa85qGdbmf0Rb0Pkde6
공개 권한: 링크가 있는 모든 사용자 → 뷰어
```

## 1. Apps Script 프로젝트 생성

1. `https://script.google.com/`을 엽니다.
2. Google Drive 소유 계정으로 로그인합니다.
3. `새 프로젝트`를 누릅니다.
4. 이름을 `Cellpinda Global Drive Feed`로 변경합니다.

## 2. 코드 설치

1. 저장소의 `apps-script/Code.gs` 전체를 복사합니다.
2. Apps Script 기본 `Code.gs`를 모두 지우고 붙여 넣습니다.
3. 프로젝트 설정에서 매니페스트 표시를 켭니다.
4. `apps-script/appsscript.json` 내용을 매니페스트에 붙여 넣습니다.
5. 저장합니다.

## 3. 권한 승인과 테스트

1. 함수 목록에서 `testFeed`를 선택합니다.
2. `실행`을 누릅니다.
3. Drive 읽기 권한을 승인합니다.
4. 로그에서 `ok: true`, 올바른 폴더명, 1개 이상의 파일을 확인합니다.

스크립트는 Drive 원본을 수정하거나 삭제하지 않습니다.

## 4. 웹 앱 배포

1. `배포 → 새 배포 → 웹 앱`
2. 다음 사용자로 실행: `나`
3. 액세스 권한: `모든 사용자` 또는 `익명 사용자를 포함한 모든 사용자`
4. 배포 후 `/exec` URL을 복사합니다.

```text
https://script.google.com/macros/s/배포_ID/exec
```

시크릿 브라우저에서 URL을 열어 로그인 없이 `"ok": true` JSON이 표시되는지 확인합니다.

## 5. GitHub 변수 등록

저장소의 `Settings → Secrets and variables → Actions → Variables`에서 등록합니다.

```text
Name: GOOGLE_DRIVE_FEED_URL
Value: Apps Script /exec URL
```

Google Cloud 프로젝트, Drive API 키, 서비스 계정 JSON은 필요하지 않습니다.

## 6. 첫 동기화

`Actions → Sync Google Drive Index → Run workflow`를 실행합니다.

```text
Apps Script JSON 읽기
→ 공개 문서 분류
→ 인증서 만료와 규제 문구 통제
→ index.json / status.json 생성
→ 검증 및 production build
→ automation/google-drive-index Pull Request 생성
```

## 7. 자동 병합 선택

Repository variable을 추가하면 검증 후 자동 병합할 수 있습니다.

```text
Name: AUTO_MERGE_DRIVE_INDEX
Value: true
```

## 이후 사용법

기존 Drive의 적합한 공개 카테고리 폴더에 파일만 추가합니다. GitHub Actions는 매일 07:15 KST에 동기화합니다.

| 문제 | 확인 사항 |
|---|---|
| 웹 앱이 로그인을 요구 | 배포 액세스 권한을 모든 사용자로 변경 |
| `ok: false` | Apps Script 실행 로그와 Drive 읽기 승인 확인 |
| 파일 수가 0 | 공개 Data Room 안의 파일과 공개 권한 확인 |
| GitHub 구성 오류 | `GOOGLE_DRIVE_FEED_URL` 이름과 `/exec` 주소 확인 |
| 자동 PR 실패 | Actions Read/write 및 PR 생성 허용 확인 |
