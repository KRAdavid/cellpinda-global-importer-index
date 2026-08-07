export const SUPPORTED_LANGUAGES = ["English", "Korean", "Japanese", "Chinese"] as const;

export type UiLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type GuidedCategoryId =
  | "product"
  | "quality"
  | "research"
  | "regulation"
  | "import"
  | "cases";

export interface SearchIndexResearch {
  studyType?: string;
  population?: string;
  sampleSize?: number | string | null;
  dose?: string;
  duration?: string;
  keyResults?: string;
  limitations?: string;
  evidenceStatus?: string;
  pmid?: string | null;
  doi?: string | null;
  cellpindaDirectness?: string;
}

export interface SearchIndexDocument {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  country: string;
  language: string;
  summary: string;
  tags: string[];
  sourceUrl: string | null;
  downloadUrl: string | null;
  lastUpdated: string | null;
  status: string;
  dashboardPath: string;
  sourceType?: string;
  currentOrArchive?: "Current" | "Archive";
  sample?: boolean;
  featured?: boolean;
  research?: SearchIndexResearch;
}

export interface SearchIndex {
  schemaVersion: string;
  generatedAt: string;
  sourceMode: "sample" | "drive";
  documents: SearchIndexDocument[];
}

export interface PreviousSelection {
  id: string;
  label: string;
  value: string;
}

export interface GuidedContext {
  country: string;
  language: UiLanguage;
  productType: string;
  topic: string;
  subTopic: string;
  previousSelections: PreviousSelection[];
}

export type ContextField = "country" | "productType" | "topic" | "subTopic";

export interface LocalizedText {
  English: string;
  Korean: string;
  Japanese: string;
  Chinese: string;
}

export interface GuidedChoice {
  id: string;
  field: ContextField;
  value: string;
  label: LocalizedText;
  keywords: string[];
}

export interface GuidedStep {
  id: string;
  field: ContextField;
  question: LocalizedText;
  choices: GuidedChoice[];
}

export interface GuidedCategory {
  id: GuidedCategoryId;
  label: LocalizedText;
  description: LocalizedText;
  dashboardPath: string;
}

export interface GuidedAnswer {
  category: GuidedCategoryId;
  title: string;
  answer: string;
  status: string;
  keyPoints: string[];
  documents: SearchIndexDocument[];
  sources: SearchIndexDocument[];
  nextCategories: GuidedCategoryId[];
  question?: string;
}

const text = (
  English: string,
  Korean: string,
  Japanese: string,
  Chinese: string,
): LocalizedText => ({ English, Korean, Japanese, Chinese });

export function localize(value: LocalizedText, language: UiLanguage): string {
  return value[language] || value.English;
}

export const UI_COPY = {
  title: text("Ask Cellpinda", "Ask Cellpinda", "Ask Cellpinda", "Ask Cellpinda"),
  prompt: text(
    "What would you like to know?",
    "무엇을 알고 싶으신가요?",
    "何をお知りになりたいですか？",
    "您想了解什么？",
  ),
  intro: text(
    "Follow the guided questions to find product, evidence, regulatory and importer documents without having to compose a long query.",
    "긴 질문을 작성하지 않아도 선택형 질문을 따라 제품·연구·규제·수입 자료를 찾을 수 있습니다.",
    "長い質問を入力せず、選択式の案内から製品・研究・規制・輸入資料を確認できます。",
    "无需输入长问题，即可通过选择式引导查找产品、研究、法规和进口资料。",
  ),
  context: text("Current context", "현재 컨텍스트", "現在のコンテキスト", "当前上下文"),
  country: text("Country", "국가", "国", "国家"),
  language: text("Language", "언어", "言語", "语言"),
  productType: text("Product type", "제품 유형", "製品タイプ", "产品类型"),
  topic: text("Topic", "주제", "トピック", "主题"),
  subTopic: text("Subtopic", "세부 주제", "サブトピック", "子主题"),
  clear: text("Clear context", "컨텍스트 초기화", "コンテキストを消去", "清除上下文"),
  startOver: text("Start a new topic", "새 주제 시작", "新しいトピックを開始", "开始新主题"),
  askOwn: text("Ask your own question", "직접 질문하기", "自由に質問する", "直接提问"),
  askPlaceholder: text(
    "Ask your own question",
    "직접 질문을 입력하세요",
    "質問を入力してください",
    "请输入您的问题",
  ),
  submit: text("Ask", "질문하기", "質問する", "提问"),
  answer: text("Answer", "답변", "回答", "回答"),
  keyPoints: text("Key Points", "핵심 포인트", "要点", "要点"),
  relatedDocuments: text("Related Documents", "관련 문서", "関連文書", "相关文件"),
  sources: text("Sources", "출처", "出典", "来源"),
  exploreNext: text(
    "What would you like to explore next?",
    "다음으로 무엇을 확인하시겠습니까?",
    "次に何を確認しますか？",
    "接下来您想了解什么？",
  ),
  sourcePending: text(
    "The public source link is pending Google Drive synchronization.",
    "공개 원문 링크는 Google Drive 동기화 후 연결됩니다.",
    "公開原文リンクは Google Drive 同期後に接続されます。",
    "公开原文链接将在 Google Drive 同步后连接。",
  ),
  evidenceNote: text(
    "This guided answer uses indexed metadata only. Review the original document before technical, commercial or regulatory decisions.",
    "이 안내 답변은 인덱스 메타데이터만 사용합니다. 기술·상업·규제 판단 전 원문을 확인해야 합니다.",
    "この回答は索引メタデータのみに基づきます。技術・商業・規制判断の前に原文を確認してください。",
    "本回答仅基于索引元数据。进行技术、商业或法规判断前应核对原文。",
  ),
  noDocuments: text(
    "No matching public record is currently indexed for this exact context.",
    "현재 선택한 조건과 정확히 일치하는 공개 자료가 인덱스에 없습니다.",
    "現在、この条件に完全一致する公開資料は索引にありません。",
    "当前索引中没有与此条件完全匹配的公开资料。",
  ),
  openDashboard: text("Open dashboard", "대시보드 열기", "ダッシュボードを開く", "打开仪表板"),
  viewSource: text("View source", "원문 보기", "原文を見る", "查看来源"),
  download: text("Download", "다운로드", "ダウンロード", "下载"),
  indexedRecords: text("Indexed records", "인덱스 자료", "索引レコード", "索引记录"),
  sourceMode: text("Source mode", "데이터 모드", "ソースモード", "来源模式"),
  indexSnapshot: text("Index snapshot", "인덱스 현황", "索引スナップショット", "索引概况"),
  countriesRegions: text("Countries / regions", "국가 / 지역", "国 / 地域", "国家 / 地区"),
  publicLinks: text("Public links", "공개 링크", "公開リンク", "公开链接"),
  safetyTitle: text("Evidence and regulatory guardrail", "근거·규제 안전장치", "根拠・規制ガードレール", "证据与法规防护"),
  safetyBody: text(
    "General GABA evidence is kept separate from Cellpinda product-specific evidence. Regulatory records use qualified review statuses and never imply automatic approval or importability.",
    "일반 GABA 연구와 Cellpinda 제품 자체 근거를 구분합니다. 규제 자료는 제한된 검토 상태만 사용하며 자동 승인 또는 수입 가능성을 의미하지 않습니다.",
    "一般的な GABA 研究と Cellpinda 製品固有の根拠を区別します。規制情報は限定的なレビュー状態を使用し、自動的な承認や輸入可能性を意味しません。",
    "一般 GABA 研究与 Cellpinda 产品自身证据会被区分。法规信息仅使用限定的审查状态，不代表自动获批或可进口。",
  ),
};

export const COUNTRIES = [
  "Global",
  "Canada",
  "USA",
  "EU",
  "Japan",
  "China",
  "Republic of Korea",
  "Australia",
  "United Kingdom",
  "Other",
] as const;

export const GUIDED_CATEGORIES: GuidedCategory[] = [
  {
    id: "product",
    label: text("I want to know the product", "제품을 알고 싶어요", "製品について知りたい", "我想了解产品"),
    description: text(
      "Features, specifications, manufacturing and technical documents",
      "특징·규격·제조공정·기술자료",
      "特徴・規格・製造工程・技術資料",
      "特点、规格、制造工艺和技术文件",
    ),
    dashboardPath: "/product-overview/",
  },
  {
    id: "quality",
    label: text(
      "I want to verify quality and certifications",
      "품질·인증을 확인하고 싶어요",
      "品質・認証を確認したい",
      "我想核实质量与认证",
    ),
    description: text(
      "FSSC, HACCP, ISO, Halal, Kosher, testing and certificate originals",
      "FSSC·HACCP·ISO·Halal·Kosher·시험·인증서 원본",
      "FSSC・HACCP・ISO・Halal・Kosher・試験・認証書原本",
      "FSSC、HACCP、ISO、Halal、Kosher、检测及证书原件",
    ),
    dashboardPath: "/manufacturing-quality/",
  },
  {
    id: "research",
    label: text("I want to see research and papers", "연구·논문을 보고 싶어요", "研究・論文を見たい", "我想查看研究与论文"),
    description: text(
      "Human studies, evidence status, limitations and source papers",
      "인체연구·근거수준·한계·원문",
      "ヒト試験・根拠レベル・限界・原著",
      "人体研究、证据状态、局限与原文",
    ),
    dashboardPath: "/scientific-evidence/",
  },
  {
    id: "regulation",
    label: text(
      "I want to check regulation in my country",
      "우리나라 규제를 확인하고 싶어요",
      "自国の規制を確認したい",
      "我想核实本国法规",
    ),
    description: text(
      "Country, product classification, ingredient, label and claims",
      "국가·제품분류·원료·표시·클레임",
      "国・製品分類・原料・表示・クレーム",
      "国家、产品分类、原料、标签与宣称",
    ),
    dashboardPath: "/global-regulatory-index/",
  },
  {
    id: "import",
    label: text(
      "I want to find import documents",
      "수입에 필요한 자료를 찾고 싶어요",
      "輸入に必要な資料を探したい",
      "我想查找进口所需文件",
    ),
    description: text(
      "Country-specific due-diligence and downloadable document packs",
      "국가별 실사자료·제공가능 자료·다운로드",
      "国別デューデリジェンス資料・提供可能資料・ダウンロード",
      "按国家提供尽调资料、可用文件与下载",
    ),
    dashboardPath: "/document-center/",
  },
  {
    id: "cases",
    label: text(
      "I want to see applications and case studies",
      "적용·성공사례를 보고 싶어요",
      "用途・事例を見たい",
      "我想查看应用与案例",
    ),
    description: text(
      "Food, beverage, supplement, feed and cosmetic applications",
      "Food·Beverage·Supplement·Feed·Cosmetics 적용",
      "Food・Beverage・Supplement・Feed・Cosmetics 用途",
      "食品、饮料、补充剂、饲料与化妆品应用",
    ),
    dashboardPath: "/case-studies/",
  },
];

const productTypeChoices: GuidedChoice[] = [
  {
    id: "ingredient",
    field: "productType",
    value: "GABA 100% ingredient",
    label: text("GABA 100% ingredient", "GABA 100% 원료", "GABA 100% 原料", "GABA 100% 原料"),
    keywords: ["gaba 100%", "ingredient", "powder", "raw material"],
  },
  {
    id: "supplement",
    field: "productType",
    value: "Dietary supplement",
    label: text("Dietary supplement", "섭취용 완제품", "サプリメント", "膳食补充剂"),
    keywords: ["supplement", "finished product", "stick", "capsule"],
  },
  {
    id: "food",
    field: "productType",
    value: "Food or beverage",
    label: text("Food or beverage", "식품·음료", "食品・飲料", "食品或饮料"),
    keywords: ["food", "beverage", "drink"],
  },
  {
    id: "feed",
    field: "productType",
    value: "Feed application",
    label: text("Feed application", "사료 적용", "飼料用途", "饲料应用"),
    keywords: ["feed", "animal", "livestock"],
  },
  {
    id: "cosmetics",
    field: "productType",
    value: "Cosmetic application",
    label: text("Cosmetic application", "화장품 적용", "化粧品用途", "化妆品应用"),
    keywords: ["cosmetic", "skin", "topical"],
  },
];

const countryChoices: GuidedChoice[] = COUNTRIES.filter((country) => country !== "Global").map(
  (country) => ({
    id: country.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    field: "country" as const,
    value: country,
    label: text(country, country, country, country),
    keywords: [country],
  }),
);

export function getGuidedSteps(category: GuidedCategoryId): GuidedStep[] {
  switch (category) {
    case "product":
      return [
        {
          id: "product-type",
          field: "productType",
          question: text(
            "Which product or application are you reviewing?",
            "어떤 제품 또는 적용 분야를 검토하고 있나요?",
            "どの製品・用途を検討していますか？",
            "您正在评估哪种产品或应用？",
          ),
          choices: productTypeChoices,
        },
        {
          id: "product-focus",
          field: "subTopic",
          question: text(
            "What product information do you need?",
            "어떤 제품 정보가 필요하신가요?",
            "どの製品情報が必要ですか？",
            "您需要哪类产品信息？",
          ),
          choices: [
            choice("features", "subTopic", "Product features", "Product features", "제품 특징", "製品の特徴", "产品特点", ["feature", "identity", "purity"]),
            choice("specification", "subTopic", "Specification", "Specification", "규격", "規格", "规格", ["specification", "spec", "coa"]),
            choice("manufacturing", "subTopic", "Manufacturing process", "Manufacturing process", "제조공정", "製造工程", "制造工艺", ["manufacturing", "fermentation", "process"]),
            choice("technical-docs", "subTopic", "Technical documents", "Technical documents", "Technical Document", "技術資料", "技术文件", ["technical", "document", "dossier"]),
          ],
        },
      ];
    case "quality":
      return [
        {
          id: "quality-area",
          field: "topic",
          question: text(
            "Which quality area do you want to verify?",
            "어떤 품질 영역을 확인하시겠습니까?",
            "どの品質領域を確認しますか？",
            "您想核实哪一项质量内容？",
          ),
          choices: [
            choice("cert-status", "topic", "Certification status", "Certification status", "인증 현황", "認証状況", "认证状态", ["certificate", "certification"]),
            choice("food-safety", "topic", "Food safety systems", "Food safety systems", "식품안전 시스템", "食品安全システム", "食品安全体系", ["fssc", "haccp", "iso"]),
            choice("testing", "topic", "Testing and CoA", "Testing and CoA", "시험·CoA", "試験・CoA", "检测与 CoA", ["testing", "coa", "assay", "heavy metal"]),
            choice("originals", "topic", "Original certificates", "Original certificates", "인증서 원본", "認証書原本", "证书原件", ["original", "certificate"]),
          ],
        },
        {
          id: "quality-record",
          field: "subTopic",
          question: text(
            "Which record should the index prioritize?",
            "어떤 자료를 우선 확인하시겠습니까?",
            "どの資料を優先しますか？",
            "索引应优先查找哪项资料？",
          ),
          choices: [
            choice("fssc", "subTopic", "FSSC 22000", "FSSC 22000", "FSSC 22000", "FSSC 22000", "FSSC 22000", ["fssc 22000"]),
            choice("haccp", "subTopic", "HACCP", "HACCP", "HACCP", "HACCP", "HACCP", ["haccp"]),
            choice("iso", "subTopic", "ISO 22000", "ISO 22000", "ISO 22000", "ISO 22000", "ISO 22000", ["iso 22000"]),
            choice("halal", "subTopic", "Halal", "Halal", "Halal", "Halal", "Halal", ["halal"]),
            choice("kosher", "subTopic", "Kosher", "Kosher", "Kosher", "Kosher", "Kosher", ["kosher"]),
            choice("coa", "subTopic", "Certificate of Analysis", "Certificate of Analysis", "시험성적서·CoA", "分析証明書・CoA", "分析证书 CoA", ["certificate of analysis", "coa", "assay"]),
          ],
        },
      ];
    case "research":
      return [
        {
          id: "research-topic",
          field: "subTopic",
          question: text(
            "Which research topic are you exploring?",
            "어떤 연구 주제를 확인하시겠습니까?",
            "どの研究テーマを確認しますか？",
            "您想查看哪一研究主题？",
          ),
          choices: [
            choice("sleep", "subTopic", "Sleep", "Sleep", "수면", "睡眠", "睡眠", ["sleep"]),
            choice("stress", "subTopic", "Stress and relaxation", "Stress and relaxation", "스트레스·이완", "ストレス・リラクゼーション", "压力与放松", ["stress", "relaxation"]),
            choice("blood-pressure", "subTopic", "Blood pressure", "Blood pressure", "혈압", "血圧", "血压", ["blood pressure", "hypertension"]),
            choice("cognition", "subTopic", "Cognition", "Cognition", "인지", "認知", "认知", ["cognition", "memory", "focus"]),
            choice("metabolic", "subTopic", "Metabolic effects", "Metabolic effects", "대사", "代謝", "代谢", ["metabolic", "glucose", "weight"]),
            choice("safety", "subTopic", "Safety", "Safety", "안전성", "安全性", "安全性", ["safety", "tolerability"]),
          ],
        },
        {
          id: "research-type",
          field: "topic",
          question: text(
            "What level of evidence do you want to see?",
            "어떤 수준의 근거를 보고 싶으신가요?",
            "どのレベルの根拠を確認しますか？",
            "您想查看哪一层级的证据？",
          ),
          choices: [
            choice("human-clinical", "topic", "Human clinical trials", "Human clinical trials", "인체 임상시험", "ヒト臨床試験", "人体临床试验", ["human", "clinical", "randomized"]),
            choice("reviews", "topic", "Reviews and syntheses", "Reviews and syntheses", "리뷰·종합근거", "レビュー・統合", "综述与综合证据", ["review", "meta-analysis"]),
            choice("mechanistic", "topic", "Mechanistic or indirect evidence", "Mechanistic or indirect evidence", "기전·간접근거", "機序・間接的根拠", "机制或间接证据", ["mechanistic", "animal", "indirect"]),
            choice("all-evidence", "topic", "All indexed evidence", "All indexed evidence", "전체 인덱스 근거", "索引された全根拠", "全部索引证据", ["evidence"]),
          ],
        },
      ];
    case "regulation":
      return [
        {
          id: "regulatory-country",
          field: "country",
          question: text(
            "Which country or region should be checked?",
            "어느 국가 또는 지역을 확인할까요?",
            "どの国・地域を確認しますか？",
            "需要核实哪个国家或地区？",
          ),
          choices: countryChoices,
        },
        {
          id: "regulatory-product",
          field: "productType",
          question: text(
            "How would the product be placed on the market?",
            "어떤 제품 분류로 시장에 출시할 예정인가요?",
            "どの製品分類で市場投入する予定ですか？",
            "该产品计划以何种分类进入市场？",
          ),
          choices: productTypeChoices,
        },
        {
          id: "regulatory-focus",
          field: "subTopic",
          question: text(
            "Which regulatory question should be prioritized?",
            "어떤 규제 항목을 우선 확인할까요?",
            "どの規制項目を優先しますか？",
            "应优先核实哪项法规问题？",
          ),
          choices: [
            choice("classification", "subTopic", "Product classification", "Product classification", "제품 분류", "製品分類", "产品分类", ["classification", "category"]),
            choice("ingredient-status", "subTopic", "Ingredient status", "Ingredient status", "원료 지위", "原料ステータス", "原料状态", ["ingredient", "novel", "positive list"]),
            choice("label", "subTopic", "Label requirements", "Label requirements", "Label·표시", "ラベル・表示", "标签要求", ["label", "labelling"]),
            choice("claims", "subTopic", "Claims", "Claims", "Claims·표현", "クレーム", "宣称", ["claim", "health claim"]),
            choice("import-pathway", "subTopic", "Import pathway", "Import pathway", "수입 절차", "輸入手続", "进口路径", ["import", "customs", "notification"]),
          ],
        },
      ];
    case "import":
      return [
        {
          id: "import-country",
          field: "country",
          question: text(
            "Which destination market are you preparing for?",
            "어느 수입 대상국을 준비하고 있나요?",
            "どの輸入先市場を準備していますか？",
            "您正在准备进入哪个进口市场？",
          ),
          choices: countryChoices,
        },
        {
          id: "import-product",
          field: "productType",
          question: text(
            "Which product type will be imported?",
            "어떤 제품 유형을 수입할 예정인가요?",
            "どの製品タイプを輸入しますか？",
            "计划进口哪种产品类型？",
          ),
          choices: productTypeChoices,
        },
        {
          id: "import-document",
          field: "subTopic",
          question: text(
            "Which document set do you need?",
            "어떤 자료 묶음이 필요하신가요?",
            "どの資料セットが必要ですか？",
            "您需要哪一组文件？",
          ),
          choices: [
            choice("product-pack", "subTopic", "Product and specification", "Product and specification", "제품·규격 자료", "製品・規格資料", "产品与规格文件", ["product", "specification"]),
            choice("quality-pack", "subTopic", "Quality and certificates", "Quality and certificates", "품질·인증 자료", "品質・認証資料", "质量与认证文件", ["quality", "certificate", "coa"]),
            choice("science-pack", "subTopic", "Scientific support", "Scientific support", "연구·안전성 자료", "研究・安全性資料", "研究与安全性文件", ["scientific", "research", "safety"]),
            choice("regulatory-pack", "subTopic", "Regulatory package", "Regulatory package", "규제 자료", "規制資料", "法规文件", ["regulatory", "label", "claim"]),
            choice("complete-pack", "subTopic", "Complete importer package", "Complete importer package", "전체 수입자료 패키지", "輸入資料一式", "完整进口资料包", ["complete", "dossier", "importer"]),
          ],
        },
      ];
    case "cases":
      return [
        {
          id: "application-field",
          field: "productType",
          question: text(
            "Which application field are you interested in?",
            "어떤 적용 분야에 관심이 있으신가요?",
            "どの用途分野に関心がありますか？",
            "您对哪一应用领域感兴趣？",
          ),
          choices: [
            choice("food", "productType", "Food", "Food", "Food·식품", "Food・食品", "Food·食品", ["food"]),
            choice("beverage", "productType", "Beverage", "Beverage", "Beverage·음료", "Beverage・飲料", "Beverage·饮料", ["beverage", "drink"]),
            choice("supplement", "productType", "Supplement", "Supplement", "Supplement·보충제", "Supplement・サプリメント", "Supplement·补充剂", ["supplement"]),
            choice("feed", "productType", "Feed", "Feed", "Feed·사료", "Feed・飼料", "Feed·饲料", ["feed", "animal"]),
            choice("cosmetics", "productType", "Cosmetics", "Cosmetics", "Cosmetics·화장품", "Cosmetics・化粧品", "Cosmetics·化妆品", ["cosmetic", "skin"]),
          ],
        },
        {
          id: "application-focus",
          field: "subTopic",
          question: text(
            "What would you like to review for this application?",
            "이 적용 분야에서 무엇을 확인하시겠습니까?",
            "この用途で何を確認しますか？",
            "您希望查看该应用的哪些内容？",
          ),
          choices: [
            choice("case-studies", "subTopic", "Case studies", "Case studies", "적용·성공사례", "用途・事例", "应用与案例", ["case study", "success"]),
            choice("related-research", "subTopic", "Related research", "Related research", "관련 연구", "関連研究", "相关研究", ["research", "evidence"]),
            choice("technical-materials", "subTopic", "Technical materials", "Technical materials", "관련 기술자료", "関連技術資料", "相关技术文件", ["technical", "application"]),
          ],
        },
      ];
  }
}

function choice(
  id: string,
  field: ContextField,
  value: string,
  English: string,
  Korean: string,
  Japanese: string,
  Chinese: string,
  keywords: string[],
): GuidedChoice {
  return {
    id,
    field,
    value,
    label: text(English, Korean, Japanese, Chinese),
    keywords,
  };
}

const categoryDocumentMap: Record<GuidedCategoryId, string[]> = {
  product: ["Product", "Manufacturing"],
  quality: ["Quality Certificates", "Manufacturing"],
  research: ["Scientific Evidence"],
  regulation: ["Regulatory"],
  import: ["Product", "Manufacturing", "Quality Certificates", "Scientific Evidence", "Regulatory"],
  cases: ["Case Studies", "Scientific Evidence", "Product"],
};

const nextCategoryMap: Record<GuidedCategoryId, GuidedCategoryId[]> = {
  product: ["quality", "import", "regulation"],
  quality: ["import", "regulation", "product"],
  research: ["regulation", "cases", "product"],
  regulation: ["import", "quality", "product"],
  import: ["quality", "regulation", "product"],
  cases: ["research", "product", "import"],
};

const qualifiedRegulatoryStatuses = new Set([
  "Official pathway identified",
  "Product-specific review required",
  "Local confirmation required",
  "Documentation incomplete",
  "Not yet reviewed",
]);

const normalized = (value: string | null | undefined): string =>
  (value ?? "")
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const tokens = (value: string): string[] =>
  normalized(value)
    .split(/\s+/)
    .filter((token) => token.length > 1);

function documentHaystack(document: SearchIndexDocument): string {
  return normalized(
    [
      document.title,
      document.category,
      document.subcategory,
      document.country,
      document.language,
      document.summary,
      document.sourceType,
      document.status,
      ...document.tags,
      document.research?.studyType,
      document.research?.population,
      document.research?.keyResults,
      document.research?.limitations,
      document.research?.evidenceStatus,
      document.research?.cellpindaDirectness,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function scoreTokens(haystack: string, values: string[], weight: number): number {
  let score = 0;
  for (const value of values) {
    for (const token of tokens(value)) {
      if (haystack.includes(token)) score += weight;
    }
  }
  return score;
}

export function findRelevantDocuments(
  index: SearchIndex,
  category: GuidedCategoryId,
  context: GuidedContext,
  query = "",
  limit = 5,
): SearchIndexDocument[] {
  const allowedCategories = categoryDocumentMap[category];
  const selectedCountry = normalized(context.country);

  return index.documents
    .filter((document) => allowedCategories.includes(document.category))
    .filter((document) => {
      if (!selectedCountry || selectedCountry === "global" || context.country === "Other") return true;
      if (category !== "regulation" && category !== "import") return true;
      const documentCountry = normalized(document.country);
      return documentCountry === selectedCountry || documentCountry === "global";
    })
    .map((document) => {
      const haystack = documentHaystack(document);
      let score = 8;

      if (document.category === allowedCategories[0]) score += 4;
      if (document.currentOrArchive === "Current") score += 1;
      if (document.sourceUrl) score += 1;
      if (document.downloadUrl) score += 0.5;
      if (document.sample) score -= 0.25;

      const documentCountry = normalized(document.country);
      if (selectedCountry && selectedCountry !== "global") {
        if (documentCountry === selectedCountry) score += 7;
        if (documentCountry === "global") score += 2;
      }

      if (normalized(document.language) === normalized(context.language)) score += 2;

      score += scoreTokens(
        haystack,
        [context.productType, context.topic, context.subTopic],
        2.4,
      );
      score += scoreTokens(haystack, [query], 1.5);

      return { document, score };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (right.document.lastUpdated ?? "").localeCompare(left.document.lastUpdated ?? "");
    })
    .slice(0, limit)
    .map(({ document }) => document);
}

export function inferCategoryFromQuestion(question: string): GuidedCategoryId {
  const value = normalized(question);
  const keywordGroups: Array<[GuidedCategoryId, string[]]> = [
    [
      "quality",
      [
        "certificate",
        "certification",
        "fssc",
        "haccp",
        "iso",
        "halal",
        "kosher",
        "coa",
        "quality",
        "인증",
        "품질",
        "성적서",
        "認証",
        "品質",
        "认证",
        "质量",
      ],
    ],
    [
      "research",
      [
        "study",
        "paper",
        "clinical",
        "evidence",
        "sleep",
        "stress",
        "research",
        "논문",
        "연구",
        "수면",
        "스트레스",
        "研究",
        "睡眠",
        "论文",
      ],
    ],
    [
      "import",
      [
        "what documents",
        "documents do i need",
        "import document",
        "customs",
        "dossier",
        "수입 자료",
        "필요한 자료",
        "수입 서류",
        "輸入資料",
        "必要書類",
        "进口文件",
        "所需文件",
      ],
    ],
    [
      "regulation",
      [
        "regulation",
        "regulatory",
        "legal",
        "claim",
        "label",
        "ingredient status",
        "approved",
        "규제",
        "표시",
        "클레임",
        "원료 지위",
        "規制",
        "表示",
        "法规",
        "标签",
        "宣称",
      ],
    ],
    [
      "cases",
      [
        "case",
        "application",
        "beverage",
        "feed",
        "cosmetic",
        "success",
        "사례",
        "적용",
        "음료",
        "사료",
        "화장품",
        "用途",
        "事例",
        "案例",
        "应用",
      ],
    ],
  ];

  let best: { category: GuidedCategoryId; score: number } = { category: "product", score: 0 };
  for (const [category, keywords] of keywordGroups) {
    const score = keywords.reduce((total, keyword) => total + (value.includes(normalized(keyword)) ? 1 : 0), 0);
    if (score > best.score) best = { category, score };
  }
  return best.category;
}

function categoryLabel(category: GuidedCategoryId, language: UiLanguage): string {
  return localize(
    GUIDED_CATEGORIES.find((item) => item.id === category)?.label ?? GUIDED_CATEGORIES[0].label,
    language,
  );
}

function contextSummary(context: GuidedContext): string {
  return [context.country, context.productType, context.topic, context.subTopic]
    .filter(Boolean)
    .join(" · ");
}

function deriveStatus(
  category: GuidedCategoryId,
  documents: SearchIndexDocument[],
  context: GuidedContext,
): string {
  if (category === "regulation" || category === "import") {
    const exactCountryRecord = documents.find(
      (document) =>
        document.category === "Regulatory" &&
        normalized(document.country) === normalized(context.country),
    );
    if (exactCountryRecord && qualifiedRegulatoryStatuses.has(exactCountryRecord.status)) {
      return exactCountryRecord.status;
    }
    return exactCountryRecord ? "Product-specific review required" : "Not yet reviewed";
  }

  if (documents.length === 0) return "Documentation incomplete";
  if (documents.every((document) => document.sample)) return "Documentation incomplete";
  return documents[0]?.status || "Documentation incomplete";
}

function answerText(
  category: GuidedCategoryId,
  language: UiLanguage,
  context: GuidedContext,
  count: number,
): string {
  const scope = contextSummary(context) || "Global";
  const values: Record<GuidedCategoryId, LocalizedText> = {
    product: text(
      `The index found ${count} product or manufacturing record(s) for ${scope}. Use the related specification and technical records as the starting point, then confirm the current original before commercial use.`,
      `${scope} 조건에서 제품 또는 제조 관련 자료 ${count}건을 찾았습니다. 관련 규격서와 기술자료를 출발점으로 사용하되 상업적 사용 전 최신 원본을 확인해야 합니다.`,
      `${scope} の条件で製品・製造関連資料を ${count} 件確認しました。規格書と技術資料を起点にし、商用利用前に最新原本を確認してください。`,
      `在 ${scope} 条件下找到 ${count} 条产品或制造相关记录。可先查看规格与技术文件，商业使用前应核对最新原件。`,
    ),
    quality: text(
      `The index found ${count} quality-related record(s) for ${scope}. Certificate validity, renewal status and product scope must be checked in the original certificate.`,
      `${scope} 조건에서 품질 관련 자료 ${count}건을 찾았습니다. 인증 유효기간, 갱신 상태 및 제품 적용 범위는 인증서 원본에서 확인해야 합니다.`,
      `${scope} の条件で品質関連資料を ${count} 件確認しました。認証の有効期限、更新状況、適用範囲は原本で確認してください。`,
      `在 ${scope} 条件下找到 ${count} 条质量相关记录。证书有效期、续期状态及适用范围应以原件为准。`,
    ),
    research: text(
      `The index found ${count} research record(s) for ${scope}. General GABA findings are not treated as direct clinical evidence for Cellpinda unless the record explicitly identifies direct product evidence.`,
      `${scope} 조건에서 연구자료 ${count}건을 찾았습니다. 일반 GABA 연구는 자료에 Cellpinda 직접 근거가 명시되지 않는 한 제품 자체의 임상근거로 해석하지 않습니다.`,
      `${scope} の条件で研究資料を ${count} 件確認しました。一般的な GABA 研究は、Cellpinda の直接的製品根拠と明記されない限り製品固有の臨床根拠とは扱いません。`,
      `在 ${scope} 条件下找到 ${count} 条研究记录。除非资料明确标注为 Cellpinda 直接产品证据，一般 GABA 研究不会被视为该产品自身的临床证据。`,
    ),
    regulation: text(
      `The current index contains ${count} regulatory record(s) relevant to ${scope}. The displayed status is a review status only; a product-specific and local-market confirmation is still required.`,
      `현재 인덱스에서 ${scope} 관련 규제자료 ${count}건을 찾았습니다. 표시된 상태는 검토 상태일 뿐이며 제품별·현지 시장별 확인이 추가로 필요합니다.`,
      `現在の索引には ${scope} に関連する規制資料が ${count} 件あります。表示状態はレビュー状態であり、製品別・現地市場別の確認が必要です。`,
      `当前索引中有 ${count} 条与 ${scope} 相关的法规记录。所示状态仅为审查状态，仍需进行产品特定及当地市场确认。`,
    ),
    import: text(
      `The index found ${count} record(s) that may support an importer file for ${scope}. A complete package normally combines product identity, specification/CoA, manufacturing, quality certificates, scientific support and country-specific regulatory review.`,
      `${scope} 수입자료 준비에 참고할 수 있는 자료 ${count}건을 찾았습니다. 전체 패키지는 일반적으로 제품 식별자료, 규격·CoA, 제조공정, 품질인증, 연구자료 및 국가별 규제검토를 함께 구성합니다.`,
      `${scope} の輸入資料に利用できる可能性のある資料を ${count} 件確認しました。通常、製品情報、規格・CoA、製造、品質認証、研究、国別規制レビューを組み合わせます。`,
      `找到 ${count} 条可能支持 ${scope} 进口档案的记录。完整资料包通常包括产品识别、规格/CoA、制造、质量认证、研究支持及国家特定法规审查。`,
    ),
    cases: text(
      `The index found ${count} application or evidence record(s) for ${scope}. Case outcomes must be separated from general research and verified against the original method, product and measured result.`,
      `${scope} 관련 적용사례 또는 근거자료 ${count}건을 찾았습니다. 사례 결과는 일반 연구와 구분하고 사용 제품, 방법 및 측정 결과를 원문에서 확인해야 합니다.`,
      `${scope} に関する用途・根拠資料を ${count} 件確認しました。事例結果は一般研究と区別し、使用製品、方法、測定結果を原文で確認してください。`,
      `找到 ${count} 条与 ${scope} 相关的应用或证据记录。案例结果应与一般研究区分，并核对原文中的产品、方法与测量结果。`,
    ),
  };
  return localize(values[category], language);
}

function keyPointsFor(
  category: GuidedCategoryId,
  language: UiLanguage,
  context: GuidedContext,
  documents: SearchIndexDocument[],
  status: string,
): string[] {
  const downloadable = documents.filter((document) => document.downloadUrl || document.sourceUrl).length;
  const scope = contextSummary(context) || "Global";
  const points: Record<UiLanguage, string[]> = {
    English: [
      `Search context: ${scope}`,
      `Review status: ${status}`,
      `${documents.length} related record(s); ${downloadable} currently have a public source or download link.`,
    ],
    Korean: [
      `검색 조건: ${scope}`,
      `검토 상태: ${status}`,
      `관련 자료 ${documents.length}건 중 ${downloadable}건에 공개 원문 또는 다운로드 링크가 있습니다.`,
    ],
    Japanese: [
      `検索条件: ${scope}`,
      `レビュー状態: ${status}`,
      `関連資料 ${documents.length} 件のうち ${downloadable} 件に公開原文またはダウンロードリンクがあります。`,
    ],
    Chinese: [
      `检索条件：${scope}`,
      `审查状态：${status}`,
      `${documents.length} 条相关记录中有 ${downloadable} 条提供公开来源或下载链接。`,
    ],
  };

  if (category === "research") {
    points[language].push(
      localize(
        text(
          "Evidence directness must be checked for each paper.",
          "각 논문별로 Cellpinda 제품 직접성을 확인해야 합니다.",
          "論文ごとに Cellpinda 製品への直接性を確認してください。",
          "应逐篇确认其与 Cellpinda 产品的直接性。",
        ),
        language,
      ),
    );
  }
  if (category === "regulation" || category === "import") {
    points[language].push(
      localize(
        text(
          "Local confirmation remains required before import, label or claims decisions.",
          "수입·표시·클레임 결정 전 현지 확인이 필요합니다.",
          "輸入・表示・クレーム判断前に現地確認が必要です。",
          "进口、标签或宣称决策前仍需当地确认。",
        ),
        language,
      ),
    );
  }
  return points[language];
}

export function buildGuidedAnswer(
  index: SearchIndex,
  category: GuidedCategoryId,
  context: GuidedContext,
  question = "",
): GuidedAnswer {
  const documents = findRelevantDocuments(index, category, context, question);
  const status = deriveStatus(category, documents, context);
  const language = context.language;
  const title = question.trim() || categoryLabel(category, language);

  return {
    category,
    title,
    answer:
      documents.length > 0
        ? answerText(category, language, context, documents.length)
        : localize(UI_COPY.noDocuments, language),
    status,
    keyPoints: keyPointsFor(category, language, context, documents, status),
    documents,
    sources: documents.filter((document) => Boolean(document.sourceUrl)),
    nextCategories: nextCategoryMap[category],
    question: question.trim() || undefined,
  };
}

export function getCategory(category: GuidedCategoryId): GuidedCategory {
  return GUIDED_CATEGORIES.find((item) => item.id === category) ?? GUIDED_CATEGORIES[0];
}
