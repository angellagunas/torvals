"""Representation of user in DB."""

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin
)
from django.contrib.postgres.fields import ArrayField
from django.db import models

from app.projects.models import Project
from app.sales_centers.models import SaleCenter
from app.utils.models import TimeStampedMixin


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
        ordering = ('email',)
        permissions = (
            ("can_adjust_sales", "Can adjust sales"),
            ("can_adjust_last_order", "Can adjust last order"),
            ("can_add_order")
        )

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

    is_staff = models.BooleanField(
        default=False
    )

    is_active = models.BooleanField(
        default=True
    )

    sale_center = models.ManyToManyField(
        SaleCenter
    )

    project = models.ForeignKey(
        Project,
        null=True
    )

    admin_emails = ArrayField(
        models.CharField(
            max_length=200
        ),
        blank=True,
        null=True,
        default=list
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    objects = UserManager()

    def __str__(self):
        """Return the representation in string."""
        return self.email

    def get_short_name(self):
        """The user is identified by their email address."""
        return self.email
