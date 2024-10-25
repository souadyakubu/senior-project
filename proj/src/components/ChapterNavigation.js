import React from 'react';

function ChapterNavigation({ currentChapterIndex, setCurrentChapterIndex, totalChapters }) {
    const handlePrevious = () => {
        if (currentChapterIndex > 0) {
            setCurrentChapterIndex(currentChapterIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentChapterIndex < totalChapters - 1) {
            setCurrentChapterIndex(currentChapterIndex + 1);
        }
    };

    return (
        <div className="chapter-navigation">
            <button onClick={handlePrevious} disabled={currentChapterIndex === 0}>
                Previous
            </button>
            <button onClick={handleNext} disabled={currentChapterIndex === totalChapters - 1}>
                Next
            </button>
        </div>
    );
}

export default ChapterNavigation;
