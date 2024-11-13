import {BingAccessToken, TranslationRequest, TranslationResponse} from "../types/translate";

// Define the type for Bing language codes mapping
const bingLangCode: Record<string, string> = {
    auto: "auto-detect",
    af: "af",
    am: "am",
    ar: "ar",
    az: "az",
    bg: "bg",
    bs: "bs",
    ca: "ca",
    cs: "cs",
    cy: "cy",
    da: "da",
    de: "de",
    el: "el",
    en: "en",
    es: "es",
    et: "et",
    fa: "fa",
    fi: "fi",
    fr: "fr",
    ga: "ga",
    gu: "gu",
    hi: "hi",
    hmn: "mww",
    hr: "hr",
    ht: "ht",
    hu: "hu",
    hy: "hy",
    id: "id",
    is: "is",
    it: "it",
    ja: "ja",
    kk: "kk",
    km: "km",
    kn: "kn",
    ko: "ko",
    ku: "ku",
    lo: "lo",
    lt: "lt",
    lv: "lv",
    mg: "mg",
    mi: "mi",
    ml: "ml",
    mr: "mr",
    ms: "ms",
    mt: "mt",
    my: "my",
    ne: "ne",
    nl: "nl",
    no: "nb",
    pa: "pa",
    pl: "pl",
    ps: "ps",
    ro: "ro",
    ru: "ru",
    sk: "sk",
    sl: "sl",
    sm: "sm",
    sq: "sq",
    sr: "sr-Cyrl",
    sv: "sv",
    sw: "sw",
    ta: "ta",
    te: "te",
    th: "th",
    tr: "tr",
    uk: "uk",
    ur: "ur",
    vi: "vi",
    iw: "he",
    tl: "fil",
    pt: "pt",
    "zh-CN": "zh-Hans",
    "zh-TW": "zh-Hant",
};

// Bing access token cache
let bingAccessToken: BingAccessToken | null = null;

const bingBaseUrl = "https://www.bing.com/ttranslatev3";
const bingTokenUrl = "https://www.bing.com/translator";

// Function to retrieve Bing access token and other parameters
async function getBingAccessToken(): Promise<BingAccessToken | null> {
    try {
        if (!bingAccessToken || Date.now() - bingAccessToken.tokenTs > bingAccessToken.tokenExpiryInterval) {
            const response = await fetch(bingTokenUrl);
            const data = await response.text();

            const IG = data.match(/IG:"([^"]+)"/)?.[1] || "";
            const IID = data.match(/data-iid="([^"]+)"/)?.[1] || "";
            const [key, token, interval] = JSON.parse(data.match(/params_AbusePreventionHelper\s?=\s?([^\]]+])/)?.[1] || "[]");

            bingAccessToken = {
                IG,
                IID,
                key,
                token,
                tokenTs: Date.now(),
                tokenExpiryInterval: interval,
            };
        }
        return bingAccessToken;
    } catch (e) {
        console.error("Error fetching Bing access token:", e);
        return null;
    }
}

// Function to translate text using Bing Translate API
async function bingTranslate(
    translationRequest: TranslationRequest
): Promise<TranslationResponse | null> {
    try {
        const accessToken = await getBingAccessToken();
        if (!accessToken) throw new Error("Failed to retrieve access token");

        const { token, key, IG, IID } = accessToken;

        const {text, sourceLang, targetLang} = translationRequest;

        const response = await fetch(bingBaseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },

            body: new URLSearchParams({
                text,
                fromLang: bingLangCode[sourceLang] || sourceLang,
                to: bingLangCode[targetLang] || targetLang,
                token,
                key,
                IG,
                IID: IID + "." + Date.now(),
                isVertical: "1",
            }).toString(),
        });

        const responseData = await response.json();
        console.log("responseData", responseData)

        // Parse response
        const targetText = responseData[0]?.translations[0]?.text || "";
        const detectedLang = responseData[0]?.detectedLanguage?.language || sourceLang;
        const transliteration = responseData[1]?.inputTransliteration || null;

        return {
            targetText,
            detectedLang,
            transliteration,
        };
    } catch (error) {
        console.error("Translation error:", error);
        return null;
    }
}

// Export the translate function
export { bingTranslate };
