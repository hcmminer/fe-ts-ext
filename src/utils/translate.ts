import {TranslationRequest, TranslationResponse} from "../types/translate";

const apiUrl = "https://translate.googleapis.com/translate_a/single";

// Utility translate function with optional mock behavior
const googleTranslateV1 = async (
    request: TranslationRequest
): Promise<TranslationResponse | null> => {
  // Prepare API call with required params
  const params = new URLSearchParams({
    client: "gtx",
    q: request.text,
    sl: request.sourceLang,
    tl: request.targetLang,
    dj: "1",
    hl: request.targetLang,
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
      detectedLang: "", imageUrl: "",
      targetText,
      transliteration: transliteration || null,
      pronunciation: pronunciation || null,
      dict: dict || null,
      sourceLang: json.src
    };
  } catch (error) {
    console.error("Translation error:", error);
    return null;
  }
};

export { googleTranslateV1 };
