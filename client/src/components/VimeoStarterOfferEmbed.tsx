"use client";

const VIMEO_STARTER_OFFER_SRC =
    "https://player.vimeo.com/video/1182764212?badge=0&autopause=0&player_id=0&app_id=58479";

type VimeoStarterOfferEmbedProps = {
    className?: string;
    /** Optional heading above the player */
    title?: string;
    /** Smaller title / spacing for dense layouts (e.g. signup modal) */
    compact?: boolean;
};

export default function VimeoStarterOfferEmbed({
    className = "",
    title = "How to create your starter offer",
    compact = false
}: VimeoStarterOfferEmbedProps) {
    return (
        <div className={className}>
            {title ? (
                <p
                    className={`font-bold text-gray-900 ${compact ? "text-sm mb-2" : "text-base mb-3"}`}
                >
                    {title}
                </p>
            ) : null}
            <div
                className={`mx-auto max-w-md rounded-xl overflow-hidden border-2 border-gray-200 bg-black shadow-sm ${
                    compact ? "" : "ring-1 ring-gray-100 max-w-lg"
                }`}
            >
                <div className="relative w-full aspect-video max-h-[200px] sm:max-h-[220px] md:max-h-none">
                    <iframe
                        src={VIMEO_STARTER_OFFER_SRC}
                        title="Engezhaly — starter offer guide (Vimeo)"
                        className="absolute inset-0 w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );
}
