// Type for Bing access token object
export interface BingAccessToken {
    IG: string;
    IID: string;
    key: string;
    token: string;
    tokenTs: number;
    tokenExpiryInterval: number;
}

export interface TranslationRequest {
    type?: string;
    text: string;
    sourceLang: string;
    targetLang: string
}

export interface TranslationResponse {
    success?: boolean;
    error?: any,
    action?: string;
    targetText?: string;
    detectedLang?: string;
    transliteration?: string;
    sourceLang?: string;
    targetLang?: string;
    dict?: any;  // Bạn có thể thay đổi `any` thành kiểu dữ liệu cụ thể hơn nếu cần
    imageUrl?: string;
    pronunciation?: string | null;
}
