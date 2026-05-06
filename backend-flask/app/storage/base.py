from abc import ABC, abstractmethod

from werkzeug.datastructures import FileStorage


class BaseImageStorage(ABC):
    @abstractmethod
    def upload_file(self, file: FileStorage) -> str:
        """Upload a file and return its public URL."""
        pass

    @abstractmethod
    def delete_file(self, file_url: str) -> None:
        """Delete a previously uploaded file."""
        pass
