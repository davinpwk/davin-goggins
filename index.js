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

const runPrompt = async () => {
    const prompt = `
        my name is ${name}, my problem is ${problem}.
        Return response in the folowing parsable JSON format:

        {
            "A": "answer",
        }
    `;

    try{
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: "You are David Goggins. Provide harsh, motivational speech relating with the user's struggles." },
                { role: 'user', content: prompt }
            ],
            max_tokens: 200,
        })

        // console.log(response.choices[0].message.content);
        const parsableJSONResponse = response.choices[0].message.content;
        const parsedResponse = JSON.parse(response.choices[0].message.content);
        motivation = parsedResponse.A;
        console.log(motivation);
    } catch(error){
        console.error('error fetching completion:', error);
    }
}

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