import { TranslationRequest, TranslationResponse } from "../types/translate";

const googleSearchUrl = "https://www.google.com/search";

const isEmpty = (obj: object): boolean => {
    return Object.keys(obj).length === 0;
};

const invert = (obj: Record<string, string>): Record<string, string> => {
    const invertedObj: Record<string, string> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            invertedObj[obj[key]] = key;
        }
    }
    return invertedObj;
};



// Language code maps (equivalent to langCodeJson and langCodeJsonSwapped)
const langCodeMap: Record<string, string> = {};
let langCodeMapSwapped: Record<string, string> = {};

const encodeLangCode = (lang: string): string => langCodeMap[lang] || lang;

const decodeLangCode = (lang: string): string => {
    if (isEmpty(langCodeMapSwapped)) {
        langCodeMapSwapped = invert(langCodeMap);
    }
    return langCodeMapSwapped[lang] || lang;
};


// Function to request translation
const requestTranslate = async (
    text: string,
    sourceLang: string,
    targetLang: string
): Promise<string> => {
    const lang = "en";
    const response = await fetch(`${googleSearchUrl}?q=meaning:${text}&hl=${lang}&lr=lang_${lang}`, {
        method: "GET",
    });

    // Check for errors
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.text();
};



// Function to parse and wrap the response without JSDOM
const wrapResponse = async (
    res: string,
    text: string,
    sourceLang: string,
    targetLang: string
): Promise<{
    targetText: string;
    detectedLang: string;
    transliteration: string;
}> => {
    // Sử dụng regex để tìm nội dung của `targetText`
    console.log("res>>>> :",res)
    const targetTextMatch = res.match(/<span[^>]*data-dobid=['"]dfn['"][^>]*>(.*?)<\/span>/);

    // Kiểm tra kết quả tìm kiếm và gán giá trị `targetText`
    const targetText = targetTextMatch ? targetTextMatch[1] : "";

    // Giả định ngôn ngữ phát hiện (ở đây là 'vi' cho tiếng Việt)
    const detectedLang = "en"; // Điều chỉnh nếu cần

    return {
        targetText,
        detectedLang,
        transliteration: "",
    };
};

// Main translate function
export const googleWeb = async (
    request: TranslationRequest
): Promise<TranslationResponse> => {
    try {
        const encodedSourceLang = encodeLangCode(request.sourceLang);
        const encodedTargetLang = encodeLangCode(request.targetLang);
        const response = await requestTranslate(request.text, encodedSourceLang, encodedTargetLang);

        const { targetText, detectedLang, transliteration } = await wrapResponse(
            response,
            request.text,
            encodedSourceLang,
            encodedTargetLang
        );

        return {
            targetText,
            transliteration,
            sourceLang: decodeLangCode(detectedLang),
            targetLang: decodeLangCode(encodedTargetLang),
        };
    } catch (error) {
        console.error("Translation error:", error);
        return;
    }
};
