from pathlib import Path

from flask_babel import gettext as _
from werkzeug.datastructures import FileStorage
from werkzeug.exceptions import BadRequest
from werkzeug.utils import secure_filename

from app.constants.upload import UPLOAD_PRESETS


def get_file_size(file: FileStorage) -> int:
    stream = file.stream
    current_pos = stream.tell()
    stream.seek(0, 2)
    size = stream.tell()
    stream.seek(current_pos)
    return size


def validate_uploaded_file(file: FileStorage, preset: str = 'avatar') -> None:
    if file is None:
        raise BadRequest(_('Missing uploaded file'))

    if not file.filename:
        raise BadRequest(_('Uploaded file has no filename'))

    filename = secure_filename(file.filename)
    rules = UPLOAD_PRESETS.get(preset)
    if not rules:
        raise RuntimeError(f'Unknown upload preset: {preset}')

    suffix = Path(filename).suffix.lower()
    if suffix not in rules['extensions']:
        raise BadRequest(_('Uploaded file extension is invalid'))

    if file.mimetype not in rules['mime_types']:
        raise BadRequest(_('Uploaded file content type is invalid'))

    max_bytes = rules.get('max_bytes')
    if max_bytes is not None:
        file_size = get_file_size(file)
        if file_size > max_bytes:
            raise BadRequest(_('Uploaded file is too large'))
