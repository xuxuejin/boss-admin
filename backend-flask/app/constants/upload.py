IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}

SVG_MIME_TYPES = {
    "image/svg+xml",
}

SVG_EXTENSIONS = {
    ".svg",
}

UPLOAD_PRESETS = {
    "avatar": {
        "mime_types": IMAGE_MIME_TYPES,
        "extensions": IMAGE_EXTENSIONS,
        "max_bytes": 2 * 1024 * 1024,
    },
    "image_with_svg": {
        "mime_types": IMAGE_MIME_TYPES | SVG_MIME_TYPES,
        "extensions": IMAGE_EXTENSIONS | SVG_EXTENSIONS,
        "max_bytes": 5 * 1024 * 1024,
    },
}
