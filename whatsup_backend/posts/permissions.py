from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permite que apenas o dono do objeto edite, mas leitura é liberada para todos.
    """

    def has_object_permission(self, request, view, obj):
        # Permite leitura para qualquer método "SAFE" (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Para métodos de escrita (PUT, PATCH, DELETE), verifica se o usuário é o dono
        return obj.user == request.user
