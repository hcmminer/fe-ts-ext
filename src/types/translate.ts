// Type for Bing access token object
export interface BingAccessToken {
    IG: string;
    IID: string;
    key: string;
    token: string;
    tokenTs: number;
    tokenExpiryInterval: number;
}

export interface TranslationResponse {
    targetText: string;
    sourceLang?: string;
    detectedLang?: string;
    targetLang?: string;
    transliteration?: string | null;
    pronunciation?: string | null;
    dict?: string | null;
}