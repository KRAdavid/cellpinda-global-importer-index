"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ArrowUpRightIcon, SearchIcon } from "@/components/Icons";
import searchIndexJson from "@/public/data/search-index.json";
import {
  buildGuidedAnswer,
  COUNTRIES,
  getCategory,
  getGuidedSteps,
  GUIDED_CATEGORIES,
  inferCategoryFromQuestion,
  localize,
  SUPPORTED_LANGUAGES,
  UI_COPY,
  type GuidedAnswer,
  type GuidedCategoryId,
  type GuidedChoice,
  type GuidedContext,
  type SearchIndex,
  type UiLanguage,
} from "@/lib/guided-ai";
import styles from "./AskCellpinda.module.css";

const STORAGE_KEY = "cellpinda-guided-ai-context-v1";
const index = searchIndexJson as SearchIndex;

const defaultContext: GuidedContext = {
  country: "Global",
  language: "English",
  productType: "",
  topic: "",
  subTopic: "",
  previousSelections: [],
};

const languageLabels: Record<UiLanguage, string> = {
  English: "English",
  Korean: "한국어",
  Japanese: "日本語",
  Chinese: "中文",
};

interface AskCellpindaProps {
  embedded?: boolean;
}

function isUiLanguage(value: unknown): value is UiLanguage {
  return typeof value === "string" && SUPPORTED_LANGUAGES.includes(value as UiLanguage);
}

function restoreContext(value: string | null): GuidedContext | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<GuidedContext>;
    if (!isUiLanguage(parsed.language)) return null;
    return {
      country: typeof parsed.country === "string" ? parsed.country : "Global",
      language: parsed.language,
      productType: typeof parsed.productType === "string" ? parsed.productType : "",
      topic: typeof parsed.topic === "string" ? parsed.topic : "",
      subTopic: typeof parsed.subTopic === "string" ? parsed.subTopic : "",
      previousSelections: Array.isArray(parsed.previousSelections)
        ? parsed.previousSelections
            .filter(
              (item): item is GuidedContext["previousSelections"][number] =>
                Boolean(
                  item &&
                    typeof item === "object" &&
                    "id" in item &&
                    "label" in item &&
                    "value" in item &&
                    typeof item.id === "string" &&
                    typeof item.label === "string" &&
                    typeof item.value === "string",
                ),
            )
            .slice(-12)
        : [],
    };
  } catch {
    return null;
  }
}

function formatDate(value: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function AskCellpinda({ embedded = false }: AskCellpindaProps) {
  const [context, setContext] = useState<GuidedContext>(defaultContext);
  const [activeCategory, setActiveCategory] = useState<GuidedCategoryId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answer, setAnswer] = useState<GuidedAnswer | null>(null);
  const [question, setQuestion] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const questionInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = restoreContext(window.sessionStorage.getItem(STORAGE_KEY));
    if (stored) setContext(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  }, [context, hydrated]);

  const language = context.language;
  const steps = activeCategory ? getGuidedSteps(activeCategory) : [];
  const currentStep = activeCategory && !answer ? steps[stepIndex] : undefined;
  const activeCategoryRecord = activeCategory ? getCategory(activeCategory) : null;

  const indexStats = useMemo(() => {
    const countries = new Set(
      index.documents
        .map((document) => document.country)
        .filter((country) => country && country !== "Global"),
    );
    return {
      documents: index.documents.length,
      countries: countries.size,
      linked: index.documents.filter((document) => document.sourceUrl || document.downloadUrl).length,
    };
  }, []);

  function updateContextSelection(choice: GuidedChoice): GuidedContext {
    const label = localize(choice.label, language);
    return {
      ...context,
      [choice.field]: choice.value,
      previousSelections: [
        ...context.previousSelections,
        { id: choice.id, label, value: choice.value },
      ].slice(-12),
    };
  }

  function startCategory(category: GuidedCategoryId) {
    const record = getCategory(category);
    setActiveCategory(category);
    setStepIndex(0);
    setAnswer(null);
    setContext((current) => ({
      ...current,
      topic: "",
      subTopic: "",
      previousSelections: [
        ...current.previousSelections,
        {
          id: `category-${category}`,
          label: localize(record.label, current.language),
          value: category,
        },
      ].slice(-12),
    }));
  }

  function handleChoice(choice: GuidedChoice) {
    if (!activeCategory) return;
    const nextContext = updateContextSelection(choice);
    setContext(nextContext);

    if (stepIndex < steps.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    setAnswer(buildGuidedAnswer(index, activeCategory, nextContext));
  }

  function startNewTopic() {
    setActiveCategory(null);
    setStepIndex(0);
    setAnswer(null);
    setContext((current) => ({
      ...current,
      topic: "",
      subTopic: "",
    }));
  }

  function clearContext() {
    setContext(defaultContext);
    setActiveCategory(null);
    setStepIndex(0);
    setAnswer(null);
    setQuestion("");
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  function focusOwnQuestion() {
    setActiveCategory(null);
    setAnswer(null);
    requestAnimationFrame(() => questionInputRef.current?.focus());
  }

  function handleFreeQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      questionInputRef.current?.focus();
      return;
    }

    const inferredCategory = inferCategoryFromQuestion(trimmedQuestion);
    const nextContext: GuidedContext = {
      ...context,
      previousSelections: [
        ...context.previousSelections,
        {
          id: `question-${Date.now()}`,
          label: trimmedQuestion,
          value: trimmedQuestion,
        },
      ].slice(-12),
    };

    setContext(nextContext);
    setActiveCategory(inferredCategory);
    setStepIndex(getGuidedSteps(inferredCategory).length);
    setAnswer(buildGuidedAnswer(index, inferredCategory, nextContext, trimmedQuestion));
    setQuestion("");
  }

  function updateCountry(country: string) {
    const nextContext = { ...context, country };
    setContext(nextContext);
    if (answer && activeCategory) {
      setAnswer(buildGuidedAnswer(index, activeCategory, nextContext, answer.question));
    }
  }

  function updateLanguage(nextLanguage: UiLanguage) {
    const nextContext = { ...context, language: nextLanguage };
    setContext(nextContext);
    if (answer && activeCategory) {
      setAnswer(buildGuidedAnswer(index, activeCategory, nextContext, answer.question));
    }
  }

  const contextItems = [
    { label: localize(UI_COPY.country, language), value: context.country },
    { label: localize(UI_COPY.language, language), value: languageLabels[language] },
    { label: localize(UI_COPY.productType, language), value: context.productType },
    { label: localize(UI_COPY.topic, language), value: context.topic },
    { label: localize(UI_COPY.subTopic, language), value: context.subTopic },
  ].filter((item) => item.value);

  return (
    <section
      className={`${styles.section} ${embedded ? styles.embedded : styles.fullPage}`}
      id="ask-cellpinda"
      aria-labelledby={embedded ? "ask-cellpinda-home-title" : "ask-cellpinda-page-title"}
    >
      <div className={`page-shell ${styles.shell}`}>
        <header className={styles.intro}>
          <div>
            <h2 id={embedded ? "ask-cellpinda-home-title" : "ask-cellpinda-page-title"}>
              {localize(UI_COPY.title, language)}
            </h2>
            <p className={styles.prompt}>{localize(UI_COPY.prompt, language)}</p>
            <p className={styles.introCopy}>{localize(UI_COPY.intro, language)}</p>
          </div>
          {!embedded ? (
            <Link className="button button--secondary" href="/document-center/">
              {localize(UI_COPY.openDashboard, language)} <ArrowUpRightIcon />
            </Link>
          ) : null}
        </header>

        <div className={styles.contextBar}>
          <div className={styles.contextSelectors}>
            <label>
              <span>{localize(UI_COPY.country, language)}</span>
              <select value={context.country} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateCountry(event.target.value)}>
                {COUNTRIES.map((country) => (
                  <option value={country} key={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{localize(UI_COPY.language, language)}</span>
              <select
                value={context.language}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  updateLanguage(event.target.value as UiLanguage)
                }
              >
                {SUPPORTED_LANGUAGES.map((item) => (
                  <option value={item} key={item}>
                    {languageLabels[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.contextActions}>
            <span aria-live="polite">
              {context.country} · {languageLabels[language]}
            </span>
            <button type="button" onClick={clearContext}>
              {localize(UI_COPY.clear, language)}
            </button>
          </div>
        </div>

        <div className={styles.layout}>
          <div className={styles.workspace}>
            {!activeCategory && !answer ? (
              <div className={styles.categoryStage}>
                <div className={styles.stageHeading}>
                  <h3>{localize(UI_COPY.prompt, language)}</h3>
                  <p>{localize(UI_COPY.evidenceNote, language)}</p>
                </div>
                <div className={styles.categoryGrid}>
                  {GUIDED_CATEGORIES.map((category, indexNumber) => (
                    <button
                      className={styles.categoryButton}
                      key={category.id}
                      onClick={() => startCategory(category.id)}
                      type="button"
                    >
                      <span className={styles.categoryNumber}>{indexNumber + 1}</span>
                      <span>
                        <strong>{localize(category.label, language)}</strong>
                        <small>{localize(category.description, language)}</small>
                      </span>
                    </button>
                  ))}
                  <button
                    className={`${styles.categoryButton} ${styles.categoryButtonFree}`}
                    onClick={focusOwnQuestion}
                    type="button"
                  >
                    <span className={styles.categoryNumber}>7</span>
                    <span>
                      <strong>{localize(UI_COPY.askOwn, language)}</strong>
                      <small>{localize(UI_COPY.askPlaceholder, language)}</small>
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            {currentStep && activeCategoryRecord ? (
              <div className={styles.questionStage}>
                <div className={styles.stageTopline}>
                  <span>{localize(activeCategoryRecord.label, language)}</span>
                  <span>
                    {stepIndex + 1} / {steps.length}
                  </span>
                </div>
                <h3>{localize(currentStep.question, language)}</h3>
                <div className={styles.choiceList}>
                  {currentStep.choices.map((choice) => (
                    <button key={choice.id} onClick={() => handleChoice(choice)} type="button">
                      {localize(choice.label, language)}
                    </button>
                  ))}
                </div>
                <button className={styles.textButton} type="button" onClick={startNewTopic}>
                  {localize(UI_COPY.startOver, language)}
                </button>
              </div>
            ) : null}

            {answer ? (
              <article className={styles.answerPanel} aria-live="polite">
                <div className={styles.answerHeader}>
                  <div>
                    <span>{localize(UI_COPY.answer, language)}</span>
                    <h3>{answer.title}</h3>
                  </div>
                  <span className={styles.status}>{answer.status}</span>
                </div>
                <p className={styles.answerCopy}>{answer.answer}</p>

                <section className={styles.answerSection}>
                  <h4>{localize(UI_COPY.keyPoints, language)}</h4>
                  <ul>
                    {answer.keyPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </section>

                <section className={styles.answerSection}>
                  <div className={styles.answerSectionHeading}>
                    <h4>{localize(UI_COPY.relatedDocuments, language)}</h4>
                    <Link href={getCategory(answer.category).dashboardPath}>
                      {localize(UI_COPY.openDashboard, language)} <ArrowUpRightIcon />
                    </Link>
                  </div>
                  {answer.documents.length > 0 ? (
                    <div className={styles.documentList}>
                      {answer.documents.map((document) => (
                        <article className={styles.documentItem} key={document.id}>
                          <div className={styles.documentMeta}>
                            <span>{document.category}</span>
                            <span>{document.status}</span>
                          </div>
                          <h5>{document.title}</h5>
                          <p>{document.summary}</p>
                          <div className={styles.documentFooter}>
                            <small>
                              {document.country} · {document.language} · {formatDate(document.lastUpdated)}
                            </small>
                            <div>
                              <Link href={document.dashboardPath}>
                                {localize(UI_COPY.openDashboard, language)}
                              </Link>
                              {document.sourceUrl ? (
                                <a href={document.sourceUrl} target="_blank" rel="noreferrer">
                                  {localize(UI_COPY.viewSource, language)} <ArrowUpRightIcon />
                                </a>
                              ) : null}
                              {document.downloadUrl ? (
                                <a href={document.downloadUrl} target="_blank" rel="noreferrer">
                                  {localize(UI_COPY.download, language)} <ArrowUpRightIcon />
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyState}>{localize(UI_COPY.noDocuments, language)}</p>
                  )}
                </section>

                <section className={styles.answerSection}>
                  <h4>{localize(UI_COPY.sources, language)}</h4>
                  {answer.sources.length > 0 ? (
                    <ol className={styles.sourceList}>
                      {answer.sources.map((source) => (
                        <li key={source.id}>
                          <a href={source.sourceUrl ?? "#"} target="_blank" rel="noreferrer">
                            {source.title} <ArrowUpRightIcon />
                          </a>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className={styles.emptyState}>{localize(UI_COPY.sourcePending, language)}</p>
                  )}
                </section>

                <section className={`${styles.answerSection} ${styles.nextSection}`}>
                  <h4>{localize(UI_COPY.exploreNext, language)}</h4>
                  <div className={styles.nextChoices}>
                    {answer.nextCategories.map((categoryId) => {
                      const category = getCategory(categoryId);
                      return (
                        <button key={categoryId} type="button" onClick={() => startCategory(categoryId)}>
                          {localize(category.label, language)}
                        </button>
                      );
                    })}
                    <button type="button" onClick={startNewTopic}>
                      {localize(UI_COPY.startOver, language)}
                    </button>
                  </div>
                </section>
              </article>
            ) : null}

            <form className={styles.freeQuestion} onSubmit={handleFreeQuestion}>
              <label htmlFor={embedded ? "ask-own-question-home" : "ask-own-question-page"}>
                {localize(UI_COPY.askOwn, language)}
              </label>
              <div>
                <SearchIcon />
                <input
                  id={embedded ? "ask-own-question-home" : "ask-own-question-page"}
                  ref={questionInputRef}
                  value={question}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setQuestion(event.target.value)}
                  placeholder={localize(UI_COPY.askPlaceholder, language)}
                  type="text"
                  autoComplete="off"
                />
                <button type="submit">{localize(UI_COPY.submit, language)}</button>
              </div>
              <p>{localize(UI_COPY.evidenceNote, language)}</p>
            </form>
          </div>

          <aside className={styles.sidePanel} aria-label={localize(UI_COPY.context, language)}>
            <section>
              <h3>{localize(UI_COPY.context, language)}</h3>
              <dl className={styles.contextList}>
                {contextItems.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
              {context.previousSelections.length > 0 ? (
                <div className={styles.history}>
                  {context.previousSelections.slice(-5).map((selection, indexNumber) => (
                    <span key={`${selection.id}-${indexNumber}`}>{selection.label}</span>
                  ))}
                </div>
              ) : null}
            </section>

            <section>
              <h3>{localize(UI_COPY.indexSnapshot, language)}</h3>
              <dl className={styles.indexStats}>
                <div>
                  <dt>{localize(UI_COPY.indexedRecords, language)}</dt>
                  <dd>{indexStats.documents}</dd>
                </div>
                <div>
                  <dt>{localize(UI_COPY.countriesRegions, language)}</dt>
                  <dd>{indexStats.countries}</dd>
                </div>
                <div>
                  <dt>{localize(UI_COPY.publicLinks, language)}</dt>
                  <dd>{indexStats.linked}</dd>
                </div>
                <div>
                  <dt>{localize(UI_COPY.sourceMode, language)}</dt>
                  <dd>{index.sourceMode}</dd>
                </div>
              </dl>
            </section>

            <section className={styles.guardrail}>
              <h3>{localize(UI_COPY.safetyTitle, language)}</h3>
              <p>{localize(UI_COPY.safetyBody, language)}</p>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
