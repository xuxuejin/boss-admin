import requests
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from app.exceptions import StorageUploadError
from app.storage.base import BaseImageStorage
from app.storage.validators import validate_uploaded_file


class ImgBBStorage(BaseImageStorage):
    DEFAULT_UPLOAD_URL = 'https://api.imgbb.com/1/upload'
    DEFAULT_TIMEOUT = 30

    def __init__(self, api_key: str, upload_url: str | None = None, timeout: int | None = None):
        self.api_key = api_key
        self.upload_url = upload_url or self.DEFAULT_UPLOAD_URL
        self.timeout = timeout or self.DEFAULT_TIMEOUT

    def upload_file(self, file: FileStorage) -> str:
        validate_uploaded_file(file, preset='avatar')

        if not self.api_key:
            raise StorageUploadError('ImgBB API key is not configured')

        file.stream.seek(0)
        filename = secure_filename(file.filename or '')
        if not filename:
            raise StorageUploadError('Uploaded file has no filename')

        try:
            response = requests.post(
                self.upload_url,
                params={'key': self.api_key},
                data={'name': filename},
                files={
                    'image': (
                        filename,
                        file.stream,
                        file.mimetype or 'application/octet-stream',
                    )
                },
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            raise StorageUploadError('Storage upload request failed') from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise StorageUploadError(
                f'ImgBB returned invalid JSON response: {response.text.strip()}'
            ) from exc

        if response.status_code != 200 or not payload.get('success'):
            error_message = payload.get('error', {}).get('message') or 'ImgBB upload failed'
            raise StorageUploadError(error_message)

        image_url = payload.get('data', {}).get('url')
        if not image_url:
            raise StorageUploadError('ImgBB response did not contain image url')

        return image_url

    def delete_file(self, file_url: str) -> None:
        raise NotImplementedError('ImgBB delete is not implemented')
