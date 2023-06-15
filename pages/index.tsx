import { Ayat } from '@/types';
import Head from 'next/head'
import {useState} from 'react';
import endent from "endent";
import { Answer } from '@/components/Answer/Answer';
import { IconArrowRight, IconSearch } from "@tabler/icons-react";

export default function Home() {

  const [query,setQuery] = useState("");
  const [answer,setAnswer] = useState("");
  const [chunks,setChunks] = useState<Ayat[]>([]);
  const [loading, setLoading] = useState(false);


  const handleAnswer = async () => {
    setLoading(true);

    const searchResponse = await fetch('/api/search',{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({query})
    });

    if(!searchResponse.ok){
      setLoading(false);
      return;
    }

    const results: Ayat[] = await searchResponse.json();
    setChunks(results);

    const prompt = endent`
    Use the following passages to answer the query to the best of your ability as an expert in the Quran. Do not mention that you were provided any passages in your answer: ${query}

    ${results.map((chunk) => chunk.content).join("\n")}
    `;

    // console.log(prompt);

    const answerResponse = await fetch("/api/answer",{
      method: "POST",
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({prompt})
    });

    if(!answerResponse.ok){
      setLoading(false);
      return;
    }

    const data = answerResponse.body;
    if(!data){
      return;
    }
    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let accumulatedAnswer = "";

    while(!done){
      const {value,done: doneReading} = await reader.read();
      done = doneReading;
      // const chunkValue = decoder.decode(value);
      // setAnswer((prev) => prev + chunkValue);
      const chunkValue = decoder.decode(value);
      accumulatedAnswer += chunkValue;
      setAnswer(accumulatedAnswer);

    }

    setLoading(false);

  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleAnswer();
    }
  };

  return (
    <>
      <Head>
        <title>Muslim AI</title>
        <meta name="description" content="AI Question and Answer on Quran" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className = "flex flex-col h-screen" style={{ background: 'linear-gradient(360deg, #262626 10%, #000000 90%)' }}>
        <div className="flex-1 overflow-auto">
          <div className="mx-auto flex h-full w-full max-w-[750px] flex-col items-center px-3 pt-4 sm:pt-8">
          <h1 className="text-6xl font-bold text-white text-center py-8 tracking-wider mt-6" style={{ backgroundImage: 'linear-gradient(to right, #1ce36f, #17b85a)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', fontFamily: 'Verdana' }}>Muslim AI</h1>
          <p className="mt-2 text-center text-md text-white opacity-70">
               Disclaimer: Muslim AI is an AI-powered platform built using OpenAI&apos;s gpt-4 language model. AI-generated responses may not always be entirely correct. Please use the information provided for informational purposes only and consult reliable sources for critical matters.
              </p>
            <div className="relative w-full mt-6">
              <IconSearch className="absolute top-3 w-10 left-1 h-6 rounded-full opacity-50 sm:left-3 sm:top-4 sm:h-8 text-white" />

              <input
                className="h-12 w-full rounded-full border border-zinc-600 pr-12 pl-11 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 sm:h-16 sm:py-2 sm:pr-16 sm:pl-16 sm:text-lg" style={{ background: 'linear-gradient(360deg, #151515 0%, #000000 90%)', color: 'white' }}
                type="text"
                placeholder="Ask the Quran a question"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}

              />

              <button
                className="absolute right-2 top-2.5 h-7 w-7 rounded-full p-1 hover:cursor-pointer sm:right-3 sm:top-3 sm:h-10 sm:w-10 text-white"
                onClick={handleAnswer}
              >
                <IconArrowRight />
              </button>
            </div>

{loading ? (
          <div className="mt-6 w-full">
          <>
            <div className="font-bold text-2xl text-white">Answer</div>
            <div className="animate-pulse mt-2">
            <div className="h-4 rounded" style={{ background: 'linear-gradient(360deg,  #1ce36f 10%,  #17b85a 90%)' }}></div>
            <div className="h-4 rounded mt-2" style={{ background: 'linear-gradient(360deg,  #1ce36f 10%,  #17b85a 90%)' }}></div>
            <div className="h-4 rounded mt-2" style={{ background: 'linear-gradient(360deg,  #1ce36f 10%,  #17b85a 90%)' }}></div>
            <div className="h-4 rounded mt-2" style={{ background: 'linear-gradient(360deg,  #1ce36f 10%,  #17b85a 90%)' }}></div>
            <div className="h-4 rounded mt-2" style={{ background: 'linear-gradient(360deg,  #1ce36f 10%,  #17b85a 90%)' }}></div>
            </div>
          </>
          <div className="font-bold text-2xl mt-6 text-white">Sources</div>
          <div className="animate-pulse mt-2">
            <div className="h-4 rounded" style={{ background: 'linear-gradient(360deg,  #1ce36f 0%,  #17b85a 90%)' }}></div>
            <div className="h-4 rounded mt-2" style={{ background: 'linear-gradient(360deg,  #1ce36f 10%,  #17b85a 90%)' }}></div>
            <div className="h-4 rounded mt-2" style={{ background: 'linear-gradient(360deg,  #1ce36f 10%,  #17b85a 90%)' }}></div>
            <div className="h-4 rounded mt-2" style={{ background: 'linear-gradient(360deg,  #1ce36f 10%,  #17b85a 90%)' }}></div>
            <div className="h-4 rounded mt-2" style={{ background: 'linear-gradient(360deg,  #1ce36f 10%,  #17b85a 90%)' }}></div>
          </div>
          </div>
            ) : answer ? (
              <div className="mt-6">
                <div className="font-bold text-2xl mb-2 text-white">Answer</div>
                <Answer text= {answer} />

                <div className="mt-6 mb-16">
                  <div className="font-bold text-2xl text-white">Sources</div>

                  {chunks.map((chunk, index) => (
                    <div key={index}>
                      <div className="mt-4 border border-zinc-600 rounded-lg p-4">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-bold text-xl text-white">{chunk.surah_title}</div>
                          </div>
 
                        </div>
                        <div className="mt-2 text-white opacity-75">{chunk.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : chunks.length > 0 ? (
              <div className="mt-6 pb-16">
                <div className="font-bold text-2xl text-white">Sources</div>
                {chunks.map((chunk, index) => (
                  <div key={index}>
                    <div className="mt-4 border border-zinc-600 rounded-lg p-4">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-bold text-xl text-white">{chunk.surah_title}</div>
                        </div>
  
                      </div>
                      <div className="mt-2 text-white opacity-75">{chunk.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 text-center text-lg text-white opacity-75">{`AI-powered search for the Quran.`}</div>
            )}
          </div>
        </div>
       
      </div>
    </>
  );
}

