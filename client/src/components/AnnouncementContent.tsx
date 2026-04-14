"use client";

import React, { useMemo } from "react";

const URL_INLINE_RE = /https?:\/\/[^\s<]+[^<.,:;"')\]\s]/gi;

export function videoEmbedUrlFromLink(url: string): string | null {
    if (!url) return null;
    let m = url.match(
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    );
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    m = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
    return null;
}

function linkifyLine(line: string, keyPrefix: string): React.ReactNode {
    const nodes: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    const re = new RegExp(URL_INLINE_RE.source, "gi");
    let i = 0;
    while ((m = re.exec(line)) !== null) {
        if (m.index > last) {
            nodes.push(
                <React.Fragment key={`${keyPrefix}-t-${i++}`}>{line.slice(last, m.index)}</React.Fragment>
            );
        }
        const href = m[0];
        nodes.push(
            <a
                key={`${keyPrefix}-a-${i++}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#09BF44] font-bold underline break-all"
            >
                {href}
            </a>
        );
        last = m.index + href.length;
    }
    if (last < line.length) {
        nodes.push(<React.Fragment key={`${keyPrefix}-t-${i++}`}>{line.slice(last)}</React.Fragment>);
    }
    return nodes.length > 0 ? <>{nodes}</> : line;
}

export default function AnnouncementContent({
    content,
    videoLink
}: {
    content?: string | null;
    videoLink?: string | null;
}) {
    const mainEmbed = videoLink?.trim() ? videoEmbedUrlFromLink(videoLink.trim()) : null;

    const embedUrlsFromContent = useMemo(() => {
        if (!content?.trim()) return [];
        const raw = content.match(/https?:\/\/[^\s]+/g) || [];
        const cleaned = raw.map((u) => u.replace(/[.,;:)\]]+$/g, ""));
        const seen = new Set<string>();
        const out: string[] = [];
        for (const u of cleaned) {
            const emb = videoEmbedUrlFromLink(u);
            if (!emb || seen.has(emb)) continue;
            seen.add(emb);
            if (mainEmbed && emb === mainEmbed) continue;
            out.push(emb);
            if (out.length >= 3) break;
        }
        return out;
    }, [content, mainEmbed]);

    const lines = content?.split("\n") ?? [];

    return (
        <div className="space-y-4 min-w-0">
            {content?.trim() ? (
                <div className="text-gray-900 whitespace-pre-wrap leading-relaxed font-medium break-words min-w-0">
                    {lines.map((line, li) => (
                        <span key={li}>
                            {linkifyLine(line, `ln-${li}`)}
                            {li < lines.length - 1 ? "\n" : null}
                        </span>
                    ))}
                </div>
            ) : null}

            {mainEmbed ? (
                <div className="aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-black">
                    <iframe
                        src={mainEmbed}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Announcement video"
                    />
                </div>
            ) : null}

            {embedUrlsFromContent.map((src) => (
                <div key={src} className="aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-black">
                    <iframe
                        src={src}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Video from announcement text"
                    />
                </div>
            ))}
        </div>
    );
}
