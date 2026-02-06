interface VideoProps {
    src: string;
    title?: string;
}

export function Video({ src, title }: VideoProps) {
    // Extract video ID from various YouTube URL formats
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    const videoId = getYouTubeId(src);

    if (!videoId) {
        // Fallback for non-YouTube videos
        return (
            <div className="my-6">
                <video
                    src={src}
                    controls
                    className="w-full rounded-lg"
                    title={title}
                />
            </div>
        );
    }

    return (
        <div className="my-6">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={title || "Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                />
            </div>
            {title && (
                <p className="text-sm text-muted-foreground text-center mt-2">{title}</p>
            )}
        </div>
    );
}
