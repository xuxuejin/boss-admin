class FakeRedisClient:
    def __init__(self):
        self._data = {}

    def ping(self):
        return True

    def set(self, key, value, ex=None):
        self._data[str(key)] = value
        return True

    def setex(self, key, expire, value):
        self._data[str(key)] = value
        return True

    def get(self, key):
        return self._data.get(str(key))

    def delete(self, key):
        return 1 if self._data.pop(str(key), None) is not None else 0

    def flushall(self):
        self._data.clear()
