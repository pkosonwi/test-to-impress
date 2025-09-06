import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="relative flex-shrink-0 w-full flex items-center justify-center px-4 pt-4 pb-0 lg:pt-6 lg:pb-2 z-40">
            <img
                src="https://cdn.discordapp.com/attachments/1413490323539361914/1413873389084344350/Banner2.png?ex=68bd83b4&is=68bc3234&hm=b53e9cffe69136c64560112b0b4486014157883f26545bfa55241982b1aa5990&"
                alt="Test to Impress banner"
                className="w-full h-auto max-w-md"
            />
        </header>
    );
};