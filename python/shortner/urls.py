from . import views
from django.urls import path

urlpatterns = [
    path('', views.index, name='index'),
    path('shorten', views.shorten, name='shorten'),
    path('<str:shortId>', views.redirect, name='redirect'),
]