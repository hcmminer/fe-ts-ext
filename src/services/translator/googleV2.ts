// src/services/translator/googleV2.ts
import ky from "ky";
import { isEmpty, invert } from "lodash";
import { Token } from "./baseTranslator";
import {TranslationResponse} from "@/src/types/translate";

const tokenUrl = "https://translate.google.com";
const newGoogleUrl = "https://translate.google.com/_/TranslateWebserverUi/data/batchexecute";
const tokenTTL = 60 * 60 * 1000; // 1 hour
let token: Token | undefined;

// Module chính cho Translator Google V2
const TranslatorModule = (() => {
    let langCodeJson: Record<string, string> = {};
    let langCodeJsonSwapped: Record<string, string> = {};

    // Hàm lấy token cho API Google
    async function getTokenV2(): Promise<Token> {
        if (token && token.time + tokenTTL > Date.now()) return token;

        const res = await ky(tokenUrl).text();
        const sid = res.match(/"FdrFJe":"(.*?)"/)?.[1] || "";
        const bl = res.match(/"cfb2h":"(.*?)"/)?.[1] || "";
        const at = res.match(/"SNlM0e":"(.*?)"/)?.[1] || "";
        token = { sid, bl, at, time: Date.now() };
        return token;
    }

    // src/services/translator/googleV2.ts
    async function requestTranslate(
        text: string,
        sourceLang: string,
        targetLang: string
    ): Promise<string> {
        const { sid, bl, at } = await getTokenV2();
        const req = JSON.stringify([
            [
                [
                    "MkEWBc",
                    JSON.stringify([[text, sourceLang, targetLang, true], [null]]),
                    null,
                    "generic",
                ],
            ],
        ]);

        return await ky
            .post(newGoogleUrl, {
                headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
                searchParams: {
                    rpcids: "MkEWBc",
                    "source-path": "/",
                    "f.sid": sid,
                    bl,
                    hl: "ko",
                    "soc-app": "1",
                    "soc-platform": "1",
                    "soc-device": "1",
                    _reqid: Math.floor(10000 + 10000 * Math.random()).toString(),
                    rt: "c",
                },
                body: new URLSearchParams({ "f.req": req, at }),
                cache: 'no-store', // Thay nocache với cache: 'no-store'
            })
            .text();
    }


    // Xử lý phản hồi từ API dịch thuật
    async function wrapResponse(
        res: string,
        text: string,
        sourceLang: string,
        targetLang: string
    ): Promise<TranslationResponse> {
        const json = JSON.parse(JSON.parse(/\[.*\]/.exec(res) as any)[0][2]);
        const targetText = json[1][0][0][5].map((item: any) => item?.[0]).filter(Boolean).join(" ");

        return {
            targetText,
            detectedLang: json[0][2],
            transliteration: json[1][0][0][1],
            sourceLang,
            targetLang,
        };
    }

    function encodeLangCode(lang: string): string {
        return langCodeJson[lang] || lang;
    }

    function decodeLangCode(lang: string): string {
        if (isEmpty(langCodeJsonSwapped)) langCodeJsonSwapped = invert(langCodeJson);
        return langCodeJsonSwapped[lang] || lang;
    }

    async function translate(
        text: string,
        sourceLang: string,
        targetLang: string
    ): Promise<TranslationResponse | undefined> {
        try {
            const response = await requestTranslate(
                text,
                encodeLangCode(sourceLang),
                encodeLangCode(targetLang)
            );
            return await wrapResponse(response, text, sourceLang, targetLang);
        } catch (error) {
            console.error("Translation Error:", error);
            return undefined;
        }
    }

    return {
        translate,
        getTokenV2,
        setLangCodeJson(newLangCodeJson: Record<string, string>) {
            langCodeJson = newLangCodeJson;
        }
    };
})();

export default TranslatorModule;
