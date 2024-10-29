import React, { useState } from "react";

const TextModernizer = ({ modernizeText }) => {
    const [text, setText] = useState("");
    const [modernizedText, setModernizedText] = useState("");

    const handleSubmit = async () => {
        const result = await modernizeText(text);
        setModernizedText(result);
    };

    return (
        <div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to modernize"
            />
            <button onClick={handleSubmit}>Modernize Text</button>
            {modernizedText && <div><h3>Modernized Text:</h3><p>{modernizedText}</p></div>}
        </div>
    );
};

export default TextModernizer;
