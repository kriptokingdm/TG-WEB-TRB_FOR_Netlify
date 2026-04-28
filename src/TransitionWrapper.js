import React, { useState, useEffect } from 'react';
import './TransitionWrapper.css';

function TransitionWrapper({ children, location }) {
    const [displayChildren, setDisplayChildren] = useState(children);
    const [transitionStage, setTransitionStage] = useState('fadeIn');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (children !== displayChildren) {
            setTransitionStage('fadeOut');
        }
    }, [children, displayChildren]);

    const handleTransitionEnd = () => {
        if (transitionStage === 'fadeOut') {
            setIsLoading(true);
            setDisplayChildren(children);
            setTransitionStage('fadeIn');
            
            // Имитируем небольшую задержку для плавности
            setTimeout(() => {
                setIsLoading(false);
            }, 100);
        } else {
            setIsLoading(false);
        }
    };

    return (
        <>
            {isLoading && (
                <div className="page-transition-loader">
                    <div className="transition-spinner"></div>
                </div>
            )}
            
            <div
                className={`page-transition ${transitionStage}`}
                onAnimationEnd={handleTransitionEnd}
            >
                {displayChildren}
            </div>
        </>
    );
}

export default TransitionWrapper;