from django.contrib.sites.shortcuts import get_current_site

from django.db import models

from orax.utils.connections import Mongo


class User(models.Model):
    name = models.CharField(max_length=300)
    uuid = models.CharField(max_length=300)
    
    language = models.CharField(max_length=300)  # this is a ObjectId
    validEmail = models.BooleanField(max_length=300)
    isAdmin = models.BooleanField(max_length=300)
    isVerified = models.BooleanField(max_length=300)
    isDeleted = models.BooleanField(max_length=300)
    isOperationalUser = models.BooleanField(max_length=300)

    screenName = models.CharField(max_length=300)
    displayName = models.CharField(max_length=300)
    organizations = models.CharField(max_length=300)
    groups = models.CharField(max_length=300)


    @property
    def is_authenticated(self):
        """
        Always return True. This is a way to tell if the user has been
        authenticated in templates.
        """
        return True

    def get_current_org(self, request):
        """
        Return the current organization object
        """
        domain = get_current_site(request).domain.split('.')[0]
        organization = Mongo().organizations.find_one({
            'slug': domain,
            'isDeleted': False
        })

        return organization or None

class AnonymousUser(User):
    @property
    def is_authenticated(self):
        return False

    class Meta:
        proxy = True