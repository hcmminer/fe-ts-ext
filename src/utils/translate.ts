interface TranslationResponse {
  targetText: string;
  sourceLang: string;
  targetLang: string;
  transliteration?: string | null;
  pronunciation?: string | null;
  dict?: string | null;
}

const apiUrl = "https://translate.googleapis.com/translate_a/single";

// Utility translate function with optional mock behavior
const translate = async (
    text: string,
    sourceLang: string,
    targetLang: string,
    langCodeJson: Record<string, string> = {},
    mock: boolean = false
): Promise<TranslationResponse | null> => {
  if (mock) {
    // Mock response data
    await new Promise((resolve) => setTimeout(resolve, 300)); // Simulated delay
    return {
      targetText: `[Translated] ${text}`,
      sourceLang: sourceLang,
      targetLang: targetLang,
      transliteration: null,
      pronunciation: null,
      dict: null,
    };
  }

  // Prepare API call with required params
  const params = new URLSearchParams({
    client: "gtx",
    q: text,
    sl: sourceLang,
    tl: targetLang,
    dj: "1",
    hl: targetLang,
  }).toString() + "&dt=rm&dt=bd&dt=t&dt=qc&dt=ss";

  try {
    const response = await fetch(`${apiUrl}?${params}`);
    const json = await response.json();
    console.log(json)

    // Extract relevant details from JSON response
    const targetText = json.sentences?.map((sentence: { trans: string }) => sentence.trans).join(" ");
    const transliteration = json.sentences
        ?.map((sentence: { src_translit: string }) => sentence.src_translit)
        .filter(Boolean)
        .join(" ")
        .trim();
    const pronunciation = json.sentences
        ?.map((sentence: { src_pronunciation: string }) => sentence.src_pronunciation)
        .filter(Boolean)
        .join(" ")
        .trim();
    const dict = json.dict
        ?.map((item: { pos: string; terms: string[] }) => `${item.pos}: ${item.terms.slice(0, 3).join(", ")}`)
        .join("\n");

    return {
      targetText,
      transliteration: transliteration || null,
      pronunciation: pronunciation || null,
      dict: dict || null,
      sourceLang: json.src,
      targetLang,
    };
  } catch (error) {
    console.error("Translation error:", error);
    return null;
  }
};

export { translate };
