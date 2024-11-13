import ky from "ky";
import * as cheerio from "cheerio";
import { isEmpty, invert } from "lodash";
import * as util from "/src/util";
import {TranslationRequest, TranslationResponse} from "../types/translate";

const googleSearchUrl = "https://www.google.com/search";

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
    const response = await ky(googleSearchUrl, {
        searchParams: {
            q: `meaning:${text}`,
            hl: lang,
            lr: `lang_${lang}`,
        },
    });
    return response.text();
};

// Function to parse and wrap the response
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
    const $ = cheerio.load(res);
    const targetText = $(".eQJLDd").children(":first").find("[data-dobid='dfn']").text();
    const detectedLang = await util.detectLangBrowser(text);

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
