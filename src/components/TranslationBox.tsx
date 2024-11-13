import React, {useEffect, useState, useCallback} from "react";
import {Card, CardHeader, CardContent, CardTitle} from "../components/ui/card";
import {TranslationRequest, TranslationResponse} from "../types/translate";
import {debounce} from "../utils/debounce";

export const TranslationBox = () => {
    const [translation, setTranslation] = useState<TranslationResponse>(null);

    // Debounced function to handle document click events
    const handleDocumentClick = useCallback(
        debounce( (event) => {
            const selection = window.getSelection()?.toString().trim();
            if (selection && chrome.runtime) {
                // Kiểm tra xem extension context có hợp lệ không
                try {
                    const translationRequest: TranslationRequest = {
                        type: "translateText",
                        text: selection,
                        sourceLang: "auto",
                        targetLang: "vi"
                    }
                    chrome.runtime.sendMessage(translationRequest, (response : TranslationResponse) => {
                        setTranslation(response)
                    })
                } catch (error) {
                    console.error("Error sending message to background script:", error);
                }
            }
        }, 300), // delay của debounce là 300ms, có thể điều chỉnh
        []
    );

    useEffect(() => {
        // Đăng ký sự kiện click
        document.addEventListener("click", handleDocumentClick);

        // Hủy đăng ký sự kiện click khi component unmounts
        return () => {
            document.removeEventListener("click", handleDocumentClick);
        };
    }, [handleDocumentClick]);

    // Chỉ render khi có dữ liệu dịch
    if (!translation) return null;

    return (
        <Card className="fixed bottom-5 right-5 max-w-sm z-50 shadow-lg">
            <CardHeader>
                <CardTitle>Translation</CardTitle>
            </CardHeader>
            <CardContent>
                {translation.targetText && (
                    <p><strong>Translation:</strong> {translation.targetText}</p>
                )}
                {translation.sourceLang && (
                    <p><strong>Detected Language:</strong> {translation.sourceLang}</p>
                )}
                {translation.transliteration && (
                    <p><strong>Transliteration:</strong> {translation.transliteration}</p>
                )}
                {translation.targetLang && (
                    <p><strong>Target Language:</strong> {translation.targetLang}</p>
                )}
                {translation.dict && (
                    <p><strong>Dictionary:</strong> {JSON.stringify(translation.dict)}</p>
                )}
                {translation.imageUrl && (
                    <p><strong>Image URL:</strong> <a href={translation.imageUrl} target="_blank" rel="noopener noreferrer">{translation.imageUrl}</a></p>
                )}
                {translation.pronunciation && (
                    <p><strong>Pronunciation:</strong> {translation.pronunciation}</p>
                )}
                {translation.action && (
                    <p><strong>Action:</strong> {translation.action}</p>
                )}
                {translation.error && (
                    <p><strong>Error:</strong> {JSON.stringify(translation.error)}</p>
                )}
            </CardContent>
        </Card>
    );
};
