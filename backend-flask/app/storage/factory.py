from flask import current_app

from app.exceptions import StorageUploadError
from app.storage.base import BaseImageStorage
from app.storage.imgbb import ImgBBStorage


def build_image_storage() -> BaseImageStorage:
    provider = current_app.config.get('IMAGE_STORAGE_PROVIDER', 'imgbb')
    if provider == 'imgbb':
        return ImgBBStorage(
            api_key=current_app.config.get('IMGBB_API_KEY', ''),
        )

    raise StorageUploadError(f'Unsupported image storage provider: {provider}')
