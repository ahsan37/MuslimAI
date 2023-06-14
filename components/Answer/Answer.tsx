import {FC,useState,useEffect} from "react";
import styles from "./answer.module.css"

interface Props{
    text: string;
}

export const Answer: FC<Props> =({ text }) => {
    const [words, setWords] = useState<string[]>([]);

    useEffect(() => {
        setWords(text.split(" "));
    }, [text])
    return (
        <div>
            {words.map((word,index) => (
            <span
                key={index}
                className={styles.fadeIn}
                style = {{animationDelay: `${index * 0.1}s`}}
                >{word}{" "}</span>
            ))}
        </div>
    );
};