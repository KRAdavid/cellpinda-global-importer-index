"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const languages = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
] as const;

type Language = (typeof languages)[number]["code"];

type AudienceKey =
  | "consumer"
  | "distributor"
  | "brand"
  | "laboratory"
  | "enterprise"
  | "investor";

const copy: Record<Language, {
  eyebrow: string;
  title: string;
  intro: string;
  prompt: string;
  choose: string;
  recommended: string;
  open: string;
  latest: string;
  principles: string[];
}> = {
  ko: {
    eyebrow: "CELLPINDA HUMAN-GRADE GABA INTELLIGENCE",
    title: "당신에게 필요한 GABA 정보부터 보여드립니다.",
    intro: "제품, 품질, 분석, 규제, 논문, 사업성과 투자 자료를 방문 목적에 맞춰 탐색하는 공개형 지식 인덱스입니다.",
    prompt: "방문 목적을 선택하세요",
    choose: "언어",
    recommended: "추천 탐색 경로",
    open: "자료 열기",
    latest: "최신 공개 자료",
    principles: ["Google Sheets·Drive가 데이터 원장", "Apps Script 공개 API", "GitHub Actions 자동 검증·배포"],
  },
  en: {
    eyebrow: "CELLPINDA HUMAN-GRADE GABA INTELLIGENCE",
    title: "Start with the GABA information relevant to you.",
    intro: "A public knowledge index that organizes product, quality, analytical, regulatory, scientific, commercial and investment materials by visitor intent.",
    prompt: "Select your purpose",
    choose: "Language",
    recommended: "Recommended path",
    open: "Open resources",
    latest: "Latest public resources",
    principles: ["Google Sheets and Drive as source of truth", "Apps Script public API", "GitHub Actions validation and deployment"],
  },
  ja: {
    eyebrow: "CELLPINDA HUMAN-GRADE GABA INTELLIGENCE",
    title: "目的に合ったGABA情報からご案内します。",
    intro: "製品、品質、分析、規制、論文、事業・投資資料を訪問目的別に整理した公開型ナレッジインデックスです。",
    prompt: "訪問目的を選択",
    choose: "言語",
    recommended: "推奨閲覧ルート",
    open: "資料を開く",
    latest: "最新公開資料",
    principles: ["Google Sheets・Driveを原本管理", "Apps Script公開API", "GitHub Actions自動検証・配信"],
  },
  zh: {
    eyebrow: "CELLPINDA HUMAN-GRADE GABA INTELLIGENCE",
    title: "从与您最相关的GABA信息开始。",
    intro: "按访问目的整理产品、质量、检测、法规、论文、商业及投资资料的公开知识索引。",
    prompt: "选择访问目的",
    choose: "语言",
    recommended: "推荐浏览路径",
    open: "打开资料",
    latest: "最新公开资料",
    principles: ["Google Sheets与Drive作为数据原账", "Apps Script公开API", "GitHub Actions自动验证与部署"],
  },
};

const audiences: Record<AudienceKey, Record<Language, { label: string; description: string; path: string[] }>> = {
  consumer: {
    ko: { label: "일반 소비자", description: "GABA가 무엇인지, 제품 특징과 섭취 전 확인사항을 쉽게 확인합니다.", path: ["제품 이해", "원료·제조", "안전성·섭취 정보"] },
    en: { label: "Consumers", description: "Understand GABA, product identity and information to review before use.", path: ["Product basics", "Ingredient and process", "Safety and use"] },
    ja: { label: "一般消費者", description: "GABA、製品特性、摂取前の確認事項を分かりやすく確認します。", path: ["製品理解", "原料・製造", "安全性・摂取情報"] },
    zh: { label: "普通消费者", description: "了解GABA、产品特点及使用前应确认的信息。", path: ["产品基础", "原料与制造", "安全与食用信息"] },
  },
  distributor: {
    ko: { label: "유통사·수입사", description: "규격, 인증, 공급, 국가별 규제 및 거래 검토 자료를 빠르게 찾습니다.", path: ["제품 규격", "품질 인증", "국가별 규제·서류"] },
    en: { label: "Distributors and importers", description: "Review specifications, certifications, supply readiness and market-entry documents.", path: ["Specifications", "Quality certificates", "Regulatory packs"] },
    ja: { label: "流通・輸入企業", description: "規格、認証、供給、国別規制と取引資料を確認します。", path: ["製品規格", "品質認証", "国別規制資料"] },
    zh: { label: "经销商与进口商", description: "快速查看规格、认证、供应能力及各国法规资料。", path: ["产品规格", "质量认证", "国家法规资料"] },
  },
  brand: {
    ko: { label: "브랜드사·상품기획", description: "제품화 가능성, 적용 제형, 차별화 근거와 표시 안전성을 검토합니다.", path: ["응용·제형", "과학적 근거", "표시·마케팅 가이드"] },
    en: { label: "Brands and product teams", description: "Assess formulation fit, differentiation evidence and claim-safe communication.", path: ["Applications", "Scientific evidence", "Claims guidance"] },
    ja: { label: "ブランド・商品企画", description: "製品化、剤形、差別化根拠、表示表現を検討します。", path: ["用途・剤形", "科学的根拠", "表示ガイド"] },
    zh: { label: "品牌与产品企划", description: "评估配方应用、差异化证据及合规传播方式。", path: ["应用与剂型", "科学证据", "宣称指南"] },
  },
  laboratory: {
    ko: { label: "검사·분석기관", description: "시험항목, 분석법, COA, 규격 기준과 샘플 관련 자료를 확인합니다.", path: ["시험 규격", "분석 방법", "COA·검체 자료"] },
    en: { label: "Testing laboratories", description: "Access test specifications, methods, COAs and sample-related records.", path: ["Test specifications", "Analytical methods", "COA and samples"] },
    ja: { label: "検査・分析機関", description: "試験項目、分析法、COA、規格、検体資料を確認します。", path: ["試験規格", "分析方法", "COA・検体"] },
    zh: { label: "检测分析机构", description: "查看检测项目、分析方法、COA、规格及样品资料。", path: ["检测规格", "分析方法", "COA与样品"] },
  },
  enterprise: {
    ko: { label: "기업·기술 협력사", description: "제조기술, 품질시스템, 공급망, 공동개발 및 사업 협력 자료를 검토합니다.", path: ["제조·품질 시스템", "공급망", "공동개발·파트너십"] },
    en: { label: "Enterprise and technology partners", description: "Review manufacturing, quality systems, supply chain and collaboration opportunities.", path: ["Manufacturing and quality", "Supply chain", "Co-development"] },
    ja: { label: "企業・技術パートナー", description: "製造技術、品質、供給網、共同開発資料を検討します。", path: ["製造・品質", "サプライチェーン", "共同開発"] },
    zh: { label: "企业与技术合作方", description: "评估制造技术、质量体系、供应链及联合开发机会。", path: ["制造与质量", "供应链", "联合开发"] },
  },
  investor: {
    ko: { label: "기업·기술 투자자", description: "기술 차별성, 지식재산, 시장성, 확장성과 리스크 자료를 구조적으로 확인합니다.", path: ["기술·특허", "시장·사업모델", "실사 자료"] },
    en: { label: "Corporate and technology investors", description: "Evaluate technical differentiation, IP, market potential, scalability and risks.", path: ["Technology and IP", "Market and business model", "Due diligence"] },
    ja: { label: "企業・技術投資家", description: "技術差別化、知財、市場性、拡張性、リスクを確認します。", path: ["技術・特許", "市場・事業モデル", "デューデリジェンス"] },
    zh: { label: "企业与技术投资者", description: "系统评估技术差异、知识产权、市场、扩展性与风险。", path: ["技术与知识产权", "市场与商业模式", "尽调资料"] },
  },
};

const routeByAudience: Record<AudienceKey, string> = {
  consumer: "/product-overview/",
  distributor: "/global-regulatory-index/",
  brand: "/scientific-evidence/",
  laboratory: "/manufacturing-quality/",
  enterprise: "/manufacturing-quality/",
  investor: "/patents/",
};

export function AudienceIndex() {
  const [language, setLanguage] = useState<Language>("ko");
  const [audience, setAudience] = useState<AudienceKey>("distributor");
  const t = copy[language];
  const selected = useMemo(() => audiences[audience][language], [audience, language]);

  return (
    <section className="audience-index" aria-labelledby="audience-index-title">
      <div className="audience-index__topline">
        <span>{t.eyebrow}</span>
        <label>
          <span>{t.choose}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
            {languages.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select>
        </label>
      </div>

      <div className="audience-index__intro">
        <h1 id="audience-index-title">{t.title}</h1>
        <p>{t.intro}</p>
      </div>

      <div className="audience-index__principles">
        {t.principles.map((principle) => <span key={principle}>{principle}</span>)}
      </div>

      <div className="audience-index__body">
        <div>
          <h2>{t.prompt}</h2>
          <div className="audience-grid">
            {(Object.keys(audiences) as AudienceKey[]).map((key) => {
              const item = audiences[key][language];
              return (
                <button key={key} type="button" data-selected={key === audience} onClick={() => setAudience(key)}>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="audience-recommendation">
          <span>{t.recommended}</span>
          <h2>{selected.label}</h2>
          <p>{selected.description}</p>
          <ol>
            {selected.path.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <Link className="button button--primary" href={routeByAudience[audience]}>{t.open}</Link>
          <Link className="audience-recommendation__latest" href="/latest-updates/">{t.latest}</Link>
        </aside>
      </div>
    </section>
  );
}
