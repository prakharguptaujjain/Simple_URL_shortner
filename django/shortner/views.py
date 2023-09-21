from django.shortcuts import render
from django.conf import settings
from django.http import HttpResponse
from .utils import shortener, get_real_url
from django.middleware.csrf import get_token

domain = settings.DOMAIN

# Create your views here.


def index(request):
    csrf_token = get_token(request)
    http = f"""
        <!DOCTYPE html>
    <html>
    <head>
        <style>
        form {{
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }}
          
          input[type="text"] {{
            width: 95%;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ccc;
            border-radius: 3px;
          }}
          
          input[type="submit"] {{
            display: block;
            width: 100%;
            padding: 10px;
            background-color: #007bff;
            color: #fff;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.3s;
          }}
          
          input[type="submit"]:hover {{
            background-color: #0056b3;
          }}
        </style>          
    </head>
    <body>
        <form action="/shorten" method="post">
            <input type="hidden" name="csrfmiddlewaretoken" value="{csrf_token}" />
            <input type="text" name="url" placeholder="Enter URL to shorten" />
            <input type="submit" value="Shorten" />
        </form>
    </body>
    </html>
    """
    return HttpResponse(http)


def shorten(request):
    original_url = request.POST['url']
    print(f"original_url: {original_url}")
    print(type(original_url))
    shortId = shortener(original_url)
    if not shortId:
        shortId = 'URL does not exist'
    html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    text-align: center;
                    background-color: #f0f0f0;
                    padding: 20px;
                }}
                p {{
                    font-size: 18px;
                }}

                a {{
                    color: #007bff;
                    text-decoration: none;
                }}
            </style>
        </head>
        <body>
            <p>Shortened URL: <a href="{domain}/{shortId}">{domain}/{shortId}</a></p>
        </body>
        </html>
    """
    return HttpResponse(html)


def redirect(request, shortId):
    real_url = get_real_url(shortId)
    if not real_url:
        return HttpResponse('URL does not exist')

    return HttpResponse(f"""
    <!DOCTYPE html>
    <html>
    <head>
        <script>
            window.location.href = "{real_url}";
        </script>
    </head>
    <body>
    </body>
    </html>
    """)
