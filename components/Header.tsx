import React, { useEffect, useState } from "react";

export const Header: React.FC = () => {
    const [bannerSrc, setBannerSrc] = useState<string>("");

    useEffect(() => {
        let objectUrl: string | null = null;
        fetch("/assets/banner.png")
            .then((res) => {
                if (!res.ok) throw new Error("Banner not found");
                return res.blob();
            })
            .then((blob) => {
                objectUrl = URL.createObjectURL(blob);
                setBannerSrc(objectUrl);
            })
            .catch((err) => {
                console.error("Failed to load banner:", err);
            });

        // cleanup: revoke URL when component unmounts
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, []);

    return (
        <header className="relative flex-shrink-0 w-full flex items-center justify-center px-4 pt-4 pb-0 lg:pt-6 lg:pb-2 z-40">
            {bannerSrc ? (
                <img
                    src={bannerSrc}
                    alt="Test to Impress banner"
                    className="w-full h-auto max-w-md"
                />
            ) : (
                <div className="w-full h-[55px] max-w-md bg-neutral-200/80 rounded-lg animate-pulse" />
            )}
        </header>
    );
};
