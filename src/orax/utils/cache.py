from django.core.cache import cache


class Cache(object):
    """Cache functions to manage redis with a easy way"""

    @classmethod
    def get(self, key):
        """Get a item from redis with a given key"""
        return cache.get(key)

    @classmethod
    def exists(self, key):
        """determines if a key exists in redis"""
        #
        # the method ttl returns:
        #   - 0 if key does not exists (or already expired).
        #   - None for keys that exists but does not have any expiration.
        #   - ttl value for any volatile key (any key that has expiration).
        #
        result = cache.ttl(key)
        return result is None or result > 0

    @classmethod
    def set(self, key, value, timeout=None):
        """Set or create a new value on redis"""
        #
        # You can set a item with 3 timeouts:
        #   - timeout=0 expires the value immediately.
        #   - timeout=None infinite timeout
        #   - timeout=15 expires in 15 seconds
        #
        return cache.set(key, value, timeout)

    @classmethod
    def get_key_from_request(self, request, *args, **kwargs):
        key_cache = ''
        main_dict = {}

        if request.method == 'POST':
            main_dict = {**kwargs, **request.data}

        for key, val in main_dict.items():
            key_cache = key_cache + '{0}::{1}:'.format(key, val)

        return key_cache
