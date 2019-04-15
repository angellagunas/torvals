from rest_framework.permissions import BasePermission


class AddRowPermission(BasePermission):
    def has_permission(self, request, view):
        user_permissions = request.user.user_permissions.all()
        user_groups = request.user.groups.all()

        if view.action == 'create':
            for permission in user_permissions:
                if permission.codename == 'add_datasetrow':
                    return True

            for group in user_groups:
                for perm in group.permissions.all():
                    if perm.codename == 'add_datasetrow':
                        return True

        else:
            return True

        return False
