# Google Cloud Console 없이 Drive 공개 피드 만들기

`Code.gs`를 Google Apps Script 웹 앱으로 배포하면 GitHub Actions가 기존 `Cellpinda Global Data Room`의 공개 파일 목록을 JSON으로 읽습니다. 사용하는 기능은 Apps Script 내장 `DriveApp`과 `ContentService`뿐입니다.

## 최초 1회 설치

1. `https://script.google.com/`에서 `새 프로젝트`를 누릅니다.
2. 프로젝트 이름을 `Cellpinda Global Drive Feed`로 변경합니다.
3. 기본 `Code.gs` 내용을 지우고 이 저장소의 `apps-script/Code.gs` 전체를 붙여 넣습니다.
4. 프로젝트 설정에서 `appsscript.json 매니페스트 파일을 편집기에 표시`를 켭니다.
5. `appsscript.json`을 이 저장소의 내용으로 교체합니다.
6. 함수 목록에서 `testFeed`를 실행하고 Drive 읽기 권한을 승인합니다.
7. 로그에서 `ok: true`와 파일 수를 확인합니다.

## 웹 앱 배포

1. `배포 → 새 배포 → 웹 앱`을 선택합니다.
2. 다음 사용자로 실행: `나`
3. 액세스 권한: `모든 사용자` 또는 `익명 사용자를 포함한 모든 사용자`
4. 배포 후 `/exec` URL을 복사합니다.

```text
https://script.google.com/macros/s/배포_ID/exec
```

`/dev` 주소는 테스트 전용입니다.

## GitHub 연결

`Settings → Secrets and variables → Actions → Variables`에서 다음 Repository variable을 등록합니다.

```text
Name: GOOGLE_DRIVE_FEED_URL
Value: Apps Script의 /exec URL
```

서비스 계정 JSON, Google API 키, Google Cloud Console 프로젝트는 필요하지 않습니다.
