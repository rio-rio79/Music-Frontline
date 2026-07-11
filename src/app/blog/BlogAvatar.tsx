import Image from "next/image";

type BlogAvatarProps = {
    src: string | null;
    alt: string;
    initials: string;
    className: string;
    imageClassName: string;
    size: number;
};

export default function BlogAvatar({
    src,
    alt,
    initials,
    className,
    imageClassName,
    size,
}: BlogAvatarProps) {
    return (
        <span className={className}>
            {src ? (
                <Image
                    src={src}
                    alt={alt}
                    width={size}
                    height={size}
                    className={imageClassName}
                />
            ) : (
                initials
            )}
        </span>
    );
}
