// Import necessary modules
import ky from "ky";
import { isEmpty, invert } from "lodash";

// Define the API URL and the language code mappings
const apiUrl = "https://translate.googleapis.com/translate_a/single";

interface TranslationResponse {
    targetText: string;
    targetLang: string;
    detectedLang: string;
    transliteration?: string;
    dict?: string;
}

// Define language code JSON mappings
const langCodeJson: Record<string, string> = {};
let langCodeJsonSwapped: Record<string, string> = {};

// Utility functions for encoding and decoding language codes
function encodeLangCode(lang: string): string {
    return langCodeJson[lang] ? langCodeJson[lang] : lang;
}

function decodeLangCode(lang: string): string {
    if (isEmpty(langCodeJsonSwapped)) {
        langCodeJsonSwapped = invert(langCodeJson);
    }
    return langCodeJsonSwapped[lang] ? langCodeJsonSwapped[lang] : lang;
}

// Function to perform the translation request
async function requestTranslate(
    text: string,
    sourceLang: string,
    targetLang: string
): Promise<any> {
    const params =
        new URLSearchParams({
            client: "gtx",
            q: text,
            sl: sourceLang,
            tl: targetLang,
            dj: "1",
            hl: targetLang,
        }).toString() + "&dt=rm&dt=bd&dt=t";

    return await ky(`${apiUrl}?${params}`).json();
}

// Function to process and wrap the API response
function wrapResponse(
    res: any,
    text: string,
    sourceLang: string,
    targetLang: string
): TranslationResponse {
    const targetText = res.sentences
        ?.map((sentence: any) => sentence.trans)
        .filter((trans: string) => trans)
        .join(" ");

    const transliteration = res.sentences
        ?.map((sentence: any) => sentence.src_translit)
        .filter((translit: string) => translit)
        .join(" ")
        ?.trim();

    // Slice the top 3 dictionary terms, if available
    const dict = res.dict
        ?.map(
            (sentence: any) =>
                `${sentence.pos}: ${sentence.terms.slice(0, 3).join(", ")}`
        )
        .join("\n");

    const detectedLang = res.src;

    return {
        targetText,
        detectedLang,
        transliteration,
        dict,
        targetLang: ""
    };
}

// Main translate function
async function translate(
    text: string,
    sourceLang: string,
    targetLang: string
): Promise<TranslationResponse | undefined> {
    try {
        const encodedSourceLang = encodeLangCode(sourceLang);
        const encodedTargetLang = encodeLangCode(targetLang);

        const response = await requestTranslate(text, encodedSourceLang, encodedTargetLang);
        const { targetText, detectedLang, transliteration, dict } =
            wrapResponse(response, text, encodedSourceLang, encodedTargetLang);

        return {
            targetText,
            transliteration,
            dict,
            detectedLang: decodeLangCode(detectedLang),
            targetLang: decodeLangCode(encodedTargetLang),
        };
    } catch (error) {
        console.error("Translation error:", error);
        return undefined;
    }
}

// Export the translate function as default
export default translate;
