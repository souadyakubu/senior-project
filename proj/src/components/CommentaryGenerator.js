
import React, { useState } from "react";

const CommentaryGenerator = ({ generateCommentary }) => {
    const [text, setText] = useState("");
    const [commentary, setCommentary] = useState("");

    const handleSubmit = async () => {
        const result = await generateCommentary(text);
        setCommentary(result);
    };

    return (
        <div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text for commentary"
            />
            <button onClick={handleSubmit}>Generate Commentary</button>
            {commentary && <div><h3>Commentary:</h3><p>{commentary}</p></div>}
        </div>
    );
};

export default CommentaryGenerator;
