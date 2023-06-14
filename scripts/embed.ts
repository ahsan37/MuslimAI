import {loadEnvConfig} from "@next/env";
import {QURANJSON, Surah} from '@/types';
import fs from "fs";
import {Configuration, OpenAIApi} from "openai";
import {createClient} from "@supabase/supabase-js";

loadEnvConfig("");
console.log(process.env.OPENAI_API_KEY);
const generateEmbeddings = async (essayss: Surah[]) => {
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

for( let i = 0; i < essayss.length; i++ ) {
    const essay = essayss[i];

    for ( let j = 0; j < essay.chunks.length; j++ ) {
        const chunk = essay.chunks[j];
        

        const embeddingResponse = await openai.createEmbedding({
            model: 'text-embedding-ada-002',
            input: chunk.content
        });

        const [{embedding}] = embeddingResponse.data.data;
        const {data, error} = await supabase.from('surah').
        insert({
                surah_title: chunk.surah_title,
                surah_url: chunk.surah_url,
                content: chunk.content,
                content_tokens: chunk.content_tokens,
                embedding
            })
            .select("*");

            if (error) {
                console.log('error');
              }else{
                console.log('saved',i,j);
          }

          await new Promise((resolve) => setTimeout(resolve,500));
        }
    } 
};

(async () => {

    const json: QURANJSON = JSON.parse(fs.readFileSync('scripts/ma.json','utf8'));
    await generateEmbeddings(json.essayss);

})()