import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
dotenv.config();

import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"))

//* openAIApi area (start)

var name = '';
var problem = '';
var motivation = '';

const runPrompt = async (retryCount = 0) => {
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
                    content: "You are David Goggins. Provide a paragraph of harsh, motivational one paragraph speech relating with the user's struggles.",
                },
                { role: 'user', content: prompt },
            ],
            max_tokens: 200,
        });

        const result = response.choices[0].message.content;

        try {
            const jsonResponse = JSON.parse(result);
            console.log(jsonResponse.A); // Output the parsed answer
            motivation = jsonResponse.A;
        } catch (error) {
            console.error('Error parsing JSON:', error);
            console.log('Original response:', result); // For debugging

            // Retry if the parsing fails, up to maxRetries
            if (retryCount < maxRetries) {
                console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
                await runPrompt(retryCount + 1);
            } else {
                console.error('Max retries reached. Could not parse JSON.');
            }
        }
    } catch (error) {
        console.error('Error fetching completion:', error);
    }
};

// runPrompt();

//* openAIApi area (end)

app.get("/", (req,res) => {
    res.render("index.ejs");
})

app.post("/", async(req,res) => {
    console.log(req.body);
    try{
        name = req.body.name;
        problem = req.body.problem;
        await runPrompt();
        res.render("index.ejs", {motivation: motivation});
    } catch(error){
        console.log(error.message);
    }
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})