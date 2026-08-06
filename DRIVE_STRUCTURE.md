# Google Drive 구조와 메타데이터 규칙

Google Drive가 원본 저장소입니다. 웹사이트의 분류와 검색 품질은 폴더 위치, 파일명, 선택적 파일 설명 메타데이터 순으로 결정됩니다.

## 표준 폴더 구조

```text
Cellpinda Global Data Room
├─ 01_Product
├─ 02_Manufacturing
├─ 03_Quality_Certificates
├─ 04_Scientific_Evidence
│  ├─ Sleep
│  ├─ Stress
│  ├─ Blood_Pressure
│  ├─ Metabolic
│  ├─ Safety
│  └─ Mechanism
├─ 05_Regulatory
│  ├─ USA
│  ├─ Canada
│  ├─ EU
│  ├─ Japan
│  ├─ China
│  └─ ASEAN
├─ 06_Patents
├─ 07_Case_Studies
├─ 08_Market_Insights
└─ 99_Archive
```

최상위 폴더 이름은 자동 분류 규칙과 연결되므로 변경하지 않는 것을 권장합니다.

## 파일만 추가해도 자동 생성되는 정보

Drive 설명을 작성하지 않아도 다음 정보가 자동 생성됩니다.

- `id`: Google Drive file ID
- `title`: 파일명에서 확장자와 일부 날짜 표기를 제거한 제목
- `category`: 최상위 폴더
- `subcategory`: Evidence 또는 Regulatory의 두 번째 폴더
- `country`: Regulatory 국가 폴더 또는 기본 지역
- `language`: 파일명의 EN, KO, JP, ZH 등 토큰
- `version`: 파일명의 v1, v2.1 등
- `issueDate`: 파일명 날짜 또는 Drive 생성일
- `lastReviewed`: Drive 수정일
- `sourceType`: MIME type 또는 확장자
- `driveUrl`, `downloadUrl`: 공개 Google Drive 링크
- `status`: 카테고리와 만료일 기반 안전한 기본 상태
- `currentOrArchive`: 폴더, 만료일, 상태 기반

자동 추정값은 상태 페이지에서 메타데이터 보완 대상으로 표시될 수 있습니다.

## 권장 파일명

```text
2026-08-01_Cellpinda_GABA_Product_Specification_v3_EN.pdf
2026-07-15_FSSC_22000_Certificate_v6_EN.pdf
2025-11-20_GABA_Sleep_RCT_Smith_v1_EN.pdf
2026-06-30_Canada_GABA_Regulatory_Review_v2_EN.pdf
```

권장 순서:

```text
YYYY-MM-DD_주제_문서종류_버전_언어.확장자
```

## 선택적 Drive 설명 메타데이터

Google Drive의 파일 상세정보에서 설명(Description)을 열고 `항목: 값` 형식으로 입력합니다. 대소문자와 공백은 유연하게 처리됩니다.

### 공통 문서 예시

```text
title: Cellpinda GABA 100% Product Specification
subcategory: Product Specification
country: Republic of Korea
language: English
version: v3.0
issueDate: 2026-08-01
expiryDate:
lastReviewed: 2026-08-05
sourceType: PDF
summary: Current public product identity and specification document for importer qualification.
tags: GABA, product specification, importer, featured
status: Current
currentOrArchive: Current
featured: true
```

빈 값은 생략할 수 있습니다. 날짜는 `YYYY-MM-DD` 형식을 권장합니다.

### 논문 예시

```text
title: Example title from the original paper
subcategory: Sleep
country: Global
language: English
version: Published paper
issueDate: 2025-11-20
lastReviewed: 2026-08-05
sourceType: Peer-reviewed article
summary: Neutral summary of the research question and reported findings, including material uncertainty.
tags: GABA, sleep, randomized controlled trial
status: Reviewed
studyType: Randomized, double-blind, placebo-controlled trial
population: Adults with the study-defined condition
sampleSize: 120
dose: 100 mg/day
duration: 4 weeks
keyResults: Report only the original paper's material result without expanding the claim.
limitations: Record sample, duration, design and generalizability limitations.
evidenceStatus: Supportive
pmid: 12345678
doi: 10.xxxx/example
cellpindaDirectness: Comparable GABA evidence
```

허용 Evidence status:

- `Supportive`
- `Mixed`
- `Null`
- `Indirect`
- `Insufficient`

`Supportive`는 해당 연구 질문 안에서 보고 결과가 지지적이라는 뜻이며, Cellpinda 제품의 효능 또는 허가를 뜻하지 않습니다.

### 규제 문서 예시

```text
title: Canada GABA Regulatory Pathway Review
subcategory: Canada
country: Canada
language: English
version: v2.0
issueDate: 2026-06-30
lastReviewed: 2026-08-05
sourceType: Regulatory review
summary: Review of identified official pathways and outstanding product-specific confirmation items.
tags: Canada, regulatory, importer review
status: Product-specific review required
currentOrArchive: Current
```

허용 규제 상태:

- `Official pathway identified`
- `Product-specific review required`
- `Local confirmation required`
- `Documentation incomplete`
- `Not yet reviewed`

## 인증서 만료 처리

`expiryDate`가 현재 날짜보다 이전이면 자동으로 다음 처리됩니다.

- `status`: 명시값이 없을 경우 `Expired`
- `currentOrArchive`: `Archive`

`status: Renewal required`도 Archive로 분류됩니다. 갱신 인증서를 추가한 뒤 기존 파일은 `99_Archive`로 옮기는 것을 권장합니다.

## 공개 범위

기존 `Cellpinda Global Data Room` 최상위 폴더는 `링크가 있는 모든 사용자 → 뷰어`로 운영합니다. Apps Script는 이 승인된 공개 루트만 재귀적으로 읽으며, 개인 Drive와 별도 내부/NDA Data Room은 탐색하지 않습니다.

- 공개 루트에 들어간 하위 폴더와 파일은 상위 공개 권한을 상속받아 인덱스 대상이 됩니다.
- 스크립트는 `00_ADMIN_AND_INDEX`, `02_CONTROLLED_ACCESS`, `03_NDA_ONLY`, `04_COUNTRY_PACKS`, `05_SHIPMENT_DOCUMENTS`, `06_EXPIRED_SUPERSEDED`, `LEGACY_PUBLIC_DOWNLOADS_EMPTY` 이름의 예약 내부 폴더를 발견하면 제외합니다.
- 공개 웹에 표시하면 안 되는 자료는 공개 Data Room에 넣지 않고 별도 내부 Data Room에 보관합니다.
- Apps Script는 읽기 전용 Drive 범위만 사용하며 파일을 수정하거나 삭제하지 않습니다.

## 99_Archive 사용 원칙

Archive 폴더의 파일은 웹에서 Current 자료와 분리됩니다. 원래 카테고리를 유지하려면 Drive 설명에 `category`를 명시합니다.

```text
category: Quality Certificates
currentOrArchive: Archive
status: Superseded
```

## 삭제와 비공개 전환

- Drive에서 파일 삭제: 다음 동기화에서 인덱스 삭제
- 공개 Data Room 밖으로 이동: 다음 동기화에서 공개 인덱스 삭제
- 파일 수정: Drive 수정일과 메타데이터가 갱신
- 파일 이동: 새 폴더 규칙으로 카테고리 재분류
