const apiUrl = "https://translate.googleapis.com/translate_a/single";

// Hàm gọi API Google Translate bằng fetch
const requestTranslate = async (text, sourceLang, targetLang) => {
  const params = new URLSearchParams({
    client: "gtx",
    q: text,
    sl: sourceLang,
    tl: targetLang,
    dj: 1,
    hl: targetLang,
  }).toString() + "&dt=rm&dt=bd&dt=t";

  const response = await fetch(`${apiUrl}?${params}`);
  return await response.json();
};

// Hàm xử lý phản hồi từ API
const wrapResponse = (res) => {
  const targetText = res.sentences
    ?.map((sentence) => sentence.trans)
    .filter((trans) => trans)
    .join(" ");
  const transliteration = res.sentences
    ?.map((sentence) => sentence.src_translit)
    .filter((translit) => translit)
    .join(" ")
    ?.trim();
  const dict = res.dict
    ?.map((sentence) => `${sentence.pos}: ${sentence.terms.slice(0, 3).join(", ")}`)
    .join("\n");
  const detectedLang = res.src;

  return { targetText, detectedLang, transliteration, dict };
};

// Hàm để mã hóa mã ngôn ngữ
const encodeLangCode = (lang, langCodeJson) =>
  langCodeJson[lang] ? langCodeJson[lang] : lang;

// Hàm để giải mã mã ngôn ngữ
const decodeLangCode = (lang, langCodeJson) => {
  const langCodeJsonSwapped = Object.fromEntries(
    Object.entries(langCodeJson).map(([key, value]) => [value, key])
  );
  return langCodeJsonSwapped[lang] ? langCodeJsonSwapped[lang] : lang;
};

// Hàm translate chính
const  translate = async(text, sourceLang, targetLang, langCodeJson = {}) => {
  try {
    const encodedSourceLang = encodeLangCode(sourceLang, langCodeJson);
    const encodedTargetLang = encodeLangCode(targetLang, langCodeJson);

    const response = await requestTranslate(text, encodedSourceLang, encodedTargetLang);
    const { targetText, detectedLang, transliteration, dict } = wrapResponse(response);

    return {
      targetText,
      transliteration,
      dict,
      sourceLang: decodeLangCode(detectedLang, langCodeJson),
      targetLang: decodeLangCode(encodedTargetLang, langCodeJson),
    };
  } catch (error) {
    console.error("Translation error:", error);
    return null;
  }
};
export default translate

