import express, { Request, Response } from 'express';
import UApi from './playwright.js';
import Werror from './lib/werror.js';

const PORT = 3000;

const app = express();
const uApi = new UApi();

await uApi.start();

interface APIRequest extends Request {
    query: { q?: string };
}

app.get("/api", async (req: APIRequest, res: Response) => {
    let question: string | undefined = req.query.q;

    if (!question) {
        return res.json({
            error: 'Ask something!',
        });
    }

    let answer

    try {
        answer = await uApi.ask(question);
    } catch (err) {
        let error = new Werror(err, 'Something went wrong');

        return res.json({
            error: error.message,
        });
    }

    return res.json({ data: answer });
})

app.listen(PORT, () => { console.log('Server is up!') });
