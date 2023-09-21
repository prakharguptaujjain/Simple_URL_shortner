from django.db import models

# Create your models here.

class URL(models.Model):
    real_url = models.URLField()
    shortened_url = models.CharField(max_length=64, unique=True)

