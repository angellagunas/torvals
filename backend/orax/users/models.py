"""Representation of user in DB."""

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin
)
from django.db import models

from orax.organizations.models import Organization
from orax.routes.models import Route
from orax.sales_centers.models import SaleCenter
from orax.utils.models import TimeStampedMixin


class UserManager(BaseUserManager):
    """Custom user manager."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError('The given email must be set')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Create user who is not admin."""
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('is_staff', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        """Create user with admin persmisions."""
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_staff', True)

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedMixin):
    """Custom user model to be used accross the app."""

    class Meta:
        """Define the behavior of Model."""

        verbose_name = 'usuario'
        verbose_name_plural = 'usuarios'

    email = models.EmailField(
        max_length=254,
        unique=True,
        verbose_name='correo electronico'
    )

    name = models.CharField(
        max_length=45,
        blank=False,
        verbose_name='nombre'
    )

    uuid = models.CharField(
        max_length=300
    )

    organization = models.ForeignKey(
        Organization,
        blank=True,
        null=True
    )

    is_staff = models.BooleanField(
        default=False
    )

    is_active = models.BooleanField(
        default=False
    )

    route = models.ForeignKey(
        Route,
        null=True
    )

    agency = models.ForeignKey(
        SaleCenter,
        null=True
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    objects = UserManager()

    def get_short_name(self):
        """The user is identified by their email address."""
        return self.email
