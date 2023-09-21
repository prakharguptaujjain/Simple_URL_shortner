from hashlib import sha256
from .models import URL
import termcolor

def filter_url(url):
    if url.startswith('http://') or url.startswith('https://'):
        return url
    else:
        return 'http://' + url

from hashlib import sha256
from .models import URL  # Import your URL model

def shortener(url):
    hash = sha256(url.encode('utf-8')).hexdigest()
    shortened_url = hash[:6]
    n = 6
    while True:
        try:
            data = URL.objects.get(shortened_url=shortened_url)
            
            if data.real_url == url:
                return shortened_url
            else:
                n += 1
                shortened_url = hash[:n]
        except URL.DoesNotExist:
            URL.objects.create(real_url=url, shortened_url=shortened_url)
            return shortened_url


def get_real_url(shortened_url):
    print(termcolor.colored(f"shortened_url: {shortened_url}", 'green'))
    try:
        data = URL.objects.get(shortened_url=shortened_url)
        return data.real_url
    except URL.DoesNotExist:
        return None

