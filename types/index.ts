export type Surah = {
    title: string;
    url: string;
    content: string;
    tokens: number;
    chunks: Ayat[];
}

export type Ayat = {
    surah_title: string;
    surah_url: string;
    content: string;
    content_tokens: number;
    embedding: number[];

};

export type QURANJSON = {
    tokens: number;
    essayss: Surah[];
}
