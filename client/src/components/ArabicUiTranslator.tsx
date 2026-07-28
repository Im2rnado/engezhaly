"use client";

import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ARABIC_UI, translateUiText } from "@/lib/arabicUi";

const originalText = new WeakMap<Text, string>();
const translatedToEnglish = new Map(
  Object.entries(ARABIC_UI).map(([english, arabic]) => [arabic, english])
);
const ATTRIBUTES = ["placeholder", "aria-label", "title"] as const;

function translateTextNode(node: Text, lang: "en" | "ar") {
  const current = node.nodeValue || "";
  if (!current.trim()) return;
  const stored = originalText.get(node);
  const storedTranslation = stored ? translateUiText(stored, "ar") : null;
  const source =
    stored && (current === stored || current === storedTranslation)
      ? stored
      : translatedToEnglish.get(current.trim()) || current;
  originalText.set(node, source);
  const next = lang === "ar" ? translateUiText(source, "ar") : source;
  if (node.nodeValue !== next) node.nodeValue = next;
}

function translateElement(element: Element, lang: "en" | "ar") {
  if (element.closest("[data-no-auto-translate]")) return;
  for (const attribute of ATTRIBUTES) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    const dataKey = `data-i18n-original-${attribute}`;
    const stored = element.getAttribute(dataKey);
    const storedTranslation = stored ? translateUiText(stored, "ar") : null;
    const source =
      stored && (current === stored || current === storedTranslation)
        ? stored
        : translatedToEnglish.get(current.trim()) || current;
    element.setAttribute(dataKey, source);
    const next = lang === "ar" ? translateUiText(source, "ar") : source;
    if (current !== next) element.setAttribute(attribute, next);
  }
}

function translateTree(root: Node, lang: "en" | "ar") {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text, lang);
    return;
  }
  if (!(root instanceof Element) && root !== document.body) return;
  if (root instanceof Element) translateElement(root, lang);
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
  );
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text, lang);
    else translateElement(node as Element, lang);
    node = walker.nextNode();
  }
}

export default function ArabicUiTranslator() {
  const { lang } = useLanguage();

  useEffect(() => {
    let translating = false;
    const run = (node: Node = document.body) => {
      if (translating) return;
      translating = true;
      observer.disconnect();
      translateTree(node, lang);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [...ATTRIBUTES],
      });
      translating = false;
    };
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") run(mutation.target);
        if (mutation.type === "attributes") run(mutation.target);
        mutation.addedNodes.forEach((node) => run(node));
      }
    });
    run();
    return () => observer.disconnect();
  }, [lang]);

  return null;
}
