class BizError(Exception):
    def __init__(self, code, message, status, data=None):
        super().__init__(message)  # 把异常消息传给父类 Exception，确保 str(error) 能拿到 message
        self.code = code
        self.message = message
        self.status = status
        self.data = data


class StorageUploadError(Exception):
    """Raised when uploading a file to a third-party storage service fails."""

    pass
