const apiKey = "AIzaSyAjemEfWe9DBRcCamZ7OaxzpGKKOoQZcQo";

if (!apiKey) {
    throw new Error("API key is missing. Make sure to set it in the .env file.");
}

async function generateContent(text: string) {
    try {
        // Gọi API với `fetch`
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: text,
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        // Phân tích phản hồi JSON
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error("Error:", error);
    }
}

export { generateContent };
