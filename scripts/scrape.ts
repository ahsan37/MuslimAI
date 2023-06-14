import {Ayat, Surah, QURANJSON } from "@/types";
import axios from "axios";
import * as cheerio from "cheerio";
import { contents } from "cheerio/lib/api/traversing";
import {encode} from 'gpt-3-encoder';
import fs from "fs";

const BASE_URL = "http://www.wright-house.com";
const CHUNK_SIZE = 200;

const getLinks = async () => {
    const html = await axios.get(`${BASE_URL}/religions/islam/Quran.html`);
    const $ = cheerio.load(html.data);
    const blockquotes = $('blockquote');

    const linkArr: { url: string; title:string } [] = [];

     blockquotes.each((i,blockquote) => {
    //     if(i === 0){
            const links = $(blockquotes).find("a")
            links.each((i, link) => {
                const url = $(link).attr('href')
                const title = $(link).text()

                if (url && url.endsWith(".php")){
                    const linkObj = {
                        url,
                        title
                    };

                    linkArr.push(linkObj);
                }
            });
    //     }
    });
    return linkArr;
};
const getSurah = async (url:string, title:string) => {
    let essay: Surah = {
        title: "",
        url: "",
        content: "",
        tokens: 0,
        chunks: []
    };
    const fullUrl = `${BASE_URL}/religions/islam/${url}`;
    const html = await axios.get(fullUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }
    });   
    const $ = cheerio.load(html.data);
    const verses = $('p').has('a[name]'); // Select only <p> elements that contain an <a> element with a 'name' attribute

    verses.each((i, verse) => {
        const verseText = $(verse).contents().not($(verse).children()).text().trim();
        if (verseText) {
            essay = {
                title,
                url: fullUrl,
                content: essay.content + ' ' + verseText, // Add only the verse text to the content
                tokens: encode(essay.content + ' ' + verseText).length,
                chunks: []
            };
        }
    });

    return essay;
};

const getChunks = async (essay: Surah) => {
    const {title, url, content} = essay;

    let essayTextChunks: string[] = [];

    if(encode(content).length > CHUNK_SIZE) {
        const split = content.split(". ");
        let chunkText = "";

        for(let i = 0; i < split.length; i++) {
            const sentence = split[i]
            const sentenceTokenLength = encode(sentence).length;
            const chunkTextTokenLength = encode(chunkText).length;

            if(sentenceTokenLength + chunkTextTokenLength > CHUNK_SIZE){
                essayTextChunks.push(chunkText);
                chunkText = "";
            }

            if(sentence[sentence.length-1].match(/[a-z0-9]/i)){
                chunkText += sentence + ". ";
            } else {
                chunkText += sentence + " ";

            }
        }

         essayTextChunks.push(chunkText.trim());
        } else {
          essayTextChunks.push(content.trim());
        }

        const essayChunks: Ayat[] = essayTextChunks.map((chunkText,i) => {

            const chunk: Ayat = {
                surah_title: title,
                surah_url: url,
                content: chunkText,
                content_tokens: encode(chunkText).length,
                embedding:[]
            }

            return chunk;
        });

        if(essayChunks.length > 1){
            for(let i = 0; i < essayChunks.length; i++){
                const chunk = essayChunks[i];
                const prevChunk = essayChunks[i-1];

                if(chunk.content_tokens < 100 && prevChunk) {
                    prevChunk.content += " " + chunk.content;
                    prevChunk.content_tokens += encode(prevChunk.content).length;
                    essayChunks.splice(i, 1);
                }
            }
        }

        const chunkedEssay: Surah = {
            ...essay,
            chunks: essayChunks
        }
        return chunkedEssay;


};  

(async () => {
   const links = await getLinks();
//    console.log(links);

   let essayss: Surah[] = [];
   for(let i = 0; i<links.length; i++) {
    const link = links[i];
    const essay = await getSurah(link.url, link.title);
    const chunkedEssay = await getChunks(essay);
    essayss.push(chunkedEssay);
   }

   const json:QURANJSON = {
    tokens: essayss.reduce((acc, essay) => acc + essay.tokens,0),
    essayss
   };

   fs.writeFileSync("scripts/ma.json", JSON.stringify(json));

})();
