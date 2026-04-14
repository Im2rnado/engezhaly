"use client";

const HERO_VIMEO_SRC =
    "https://player.vimeo.com/video/1183110586?h=7579bbe614&autoplay=1&muted=1&playsinline=1&title=0&byline=0&portrait=0&dnt=1";

/**
 * Home hero Vimeo — autoplay muted, responsive 16:9.
 */
export default function HeroVimeoEmbed({ className = "" }: { className?: string }) {
    return (
        <div className={`relative w-full max-w-lg md:max-w-2xl mx-auto ${className}`}>
            <div
                className="absolute -inset-1 sm:-inset-2 rounded-[28px] bg-[#09BF44]/20 rotate-1 -z-10"
                aria-hidden
            />
            <div className="relative rounded-3xl overflow-hidden border border-gray-200/90 bg-black shadow-2xl ring-1 ring-white/70">
                <div className="relative w-full aspect-video">
                    <iframe
                        src={HERO_VIMEO_SRC}
                        title="Engezhaly — intro video"
                        className="absolute inset-0 w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );
}
