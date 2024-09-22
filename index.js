import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//* openAIApi area (start)

// Make runPrompt function return the motivation instead of storing it in a global variable
const runPrompt = async (name, problem, retryCount = 0) => {
    const maxRetries = 3;
    const prompt = `
        My name is ${name}, my problem is ${problem}.
        Return response in the following parsable JSON format:

        {
            "A": "answer"
        }
    `;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: "You are David Goggins. Provide harsh, one paragraph motivational speech relating with the user's struggles.",
                },
                { role: 'user', content: prompt },
            ],
            max_tokens: 200,
        });

        const result = response.choices[0].message.content;

        try {
            const jsonResponse = JSON.parse(result);
            console.log(jsonResponse.A); // Output the parsed answer
            return jsonResponse.A; // Return the motivation
        } catch (error) {
            console.error('Error parsing JSON:', error);
            console.log('Original response:', result); // For debugging

            // Retry if the parsing fails, up to maxRetries
            if (retryCount < maxRetries) {
                console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
                return await runPrompt(name, problem, retryCount + 1);
            } else {
                console.error('Max retries reached. Could not parse JSON.');
                return "Sorry, I couldn't generate a proper response. Try again!";
            }
        }
    } catch (error) {
        console.error('Error fetching completion:', error);
        return "Sorry, there was an error fetching your motivation.";
    }
};

//* openAIApi area (end)

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.post("/", async (req, res) => {
    console.log(req.body);
    try {
        const name = req.body.name;
        const problem = req.body.problem;
        const motivation = await runPrompt(name, problem); // Use user-specific data
        res.render("index.ejs", { motivation: motivation }); // Send motivation to the template
    } catch (error) {
        console.log(error.message);
        res.render("index.ejs", { motivation: "Error generating motivation. Please try again." });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
