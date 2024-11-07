/**
 * Hàm chia một đoạn văn thành các câu
 * @param paragraph - Đoạn văn cần chia câu
 * @returns Mảng các câu riêng biệt
 */
export const splitIntoSentences = (paragraph: string): string[] => {
    // Regex để chia đoạn văn thành câu
    return paragraph.match(/[^.!?…]+(?:\.\.\.|[.!?])[”"']?\s*/g) || [];
}
