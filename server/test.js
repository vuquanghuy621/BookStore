require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

(async () => {
    try {
        const model = genAI.getGenerativeModel({
            model: "models/gemini-1.0-pro"
        });

        const result = await model.generateContent("Hello Gemini");
        console.log(result.response.text());
    } catch (err) {
        console.error("TEST ERROR:", err);
    }
})();
