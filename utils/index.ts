import {createClient} from "@supabase/supabase-js";
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";

export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!);


export const OpenAIStream = async (prompt: string) => {
    const response = await fetch("https://api.openai.com/v1/chat/completions",{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`
        },
        body: JSON.stringify({
            model:"gpt-4-0125-preview",
            messages: [{
                role:'system',
                content:'You are a highly knowledgeable AI with a deep understanding of the Quran. Your purpose is to provide respectful, considerate, and accurate responses to user questions about the Quran, its teachings, and Islamic beliefs. Use the text provided to form your answer, but avoid copying word-for-word from the surahs. Try to use your own words when possible.'
            },{
                role:'user',
                content: prompt
            }],
            max_tokens:350,
            temperature: 0.0,
            stream: true

        })

    });

    if(response.status !== 200) {
        throw new Error("Error");
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
        async start(controller){
            const onParse = (event: ParsedEvent | ReconnectInterval) => {

                if(event.type === 'event'){
                    const data = event.data;

                    if (data === '[DONE]'){
                        controller.close();
                        return;

                    }
                    try{
                        const json = JSON.parse(data);
                        const text = json.choices[0].delta.content;
                        const queue = encoder.encode(text); 
                        controller.enqueue(queue);
                    }catch (e){
                        controller.error(e);
                    }
                }
             };

             const parser = createParser(onParse);
             for await (const chunk of response.body as any){
                parser.feed(decoder.decode(chunk));
             }
        }
    });

    return stream;
};