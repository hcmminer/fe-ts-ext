import React, { useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";

export interface TranslationBoxProps {
    text: string;
    sourceLang: string;
    transliteration?: string | null;
    onClose: () => void;
}

export const TranslationBox: React.FC<TranslationBoxProps> = ({
                                                                  text,
                                                                  sourceLang,
                                                                  transliteration,
                                                                  onClose,
                                                              }) => {
    useEffect(() => {
        // Tự động đóng hộp dịch sau 5 giây
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <Card className="fixed bottom-5 right-5 max-w-sm z-50 shadow-lg">
            <CardHeader>
                <CardTitle>Translation</CardTitle>
            </CardHeader>
            <CardContent>
                <p><strong>Translation:</strong> {text}</p>
                <p><strong>Detected Language:</strong> {sourceLang}</p>
                {transliteration && (
                    <p><strong>Transliteration:</strong> {transliteration}</p>
                )}
            </CardContent>
        </Card>
    );
};
