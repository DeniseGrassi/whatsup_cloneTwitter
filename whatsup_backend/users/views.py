from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.filters import SearchFilter

from .models import UserProfile
from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    MeProfileSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()

# -------- perfil do usuário logado (GET/PATCH) --------
class MeProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        UserProfile.objects.get_or_create(user=request.user)
        ser = MeProfileSerializer(context={"request": request})
        return Response(ser.to_representation(request.user))

    def patch(self, request):
        UserProfile.objects.get_or_create(user=request.user)

        # DEBUG: ver se o arquivo está chegando
        print("PATCH /profile/me/ → KEYS:", list(request.data.keys()))
        print("FILES names:", list(request.FILES.keys()))

        # remover avatar por query param (se você usa isso)
        if request.query_params.get("remove_avatar") == "1":
            prof = request.user.profile
            if prof.photo:
                prof.photo.delete(save=False)
            prof.photo = None
            prof.save()
            out = MeProfileSerializer(context={"request": request}).to_representation(request.user)
            return Response(out, status=200)

        ser = MeProfileSerializer(
            instance=request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        ser.is_valid(raise_exception=True)
        ser.update(request.user, ser.validated_data)
        out = MeProfileSerializer(context={"request": request}).to_representation(request.user)
        return Response(out, status=200)

# -------- troca de senha --------
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        ser = ChangePasswordSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

# -------- registro/login --------
class RegisterView(APIView):
    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    def post(self, request):
        username_or_email = request.data.get("username")
        password = request.data.get("password")
        if "@" in (username_or_email or ""):
            user = User.objects.filter(email__iexact=username_or_email).first()
            if user: username_or_email = user.username
        user = authenticate(username=username_or_email, password=password)
        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({"token": token.key})
        return Response({"error": "Credenciais inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

# -------- listagens/perfis públicos (iguais aos seus) --------
class ProfileListView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['user__username', 'user__email', 'bio']

    def get_queryset(self):
        qs = UserProfile.objects.select_related('user')
        if self.request.user.is_authenticated:
            qs = qs.exclude(user=self.request.user)
        return qs

class ProfileView(generics.RetrieveAPIView):
    queryset = UserProfile.objects.select_related("user")
    serializer_class = UserProfileSerializer
    lookup_field = "user__username"
    lookup_url_kwarg = "username"
    def get_serializer_context(self):
        return {"request": self.request}

class SuggestedProfilesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    def get_queryset(self):
        me = self.request.user.profile
        following_ids = me.following.values_list('id', flat=True)
        return (
            UserProfile.objects
            .exclude(id__in=list(following_ids) + [me.id])
            .select_related('user')
            .order_by('-id')[:20]
        )
    def get_serializer_context(self):
        return {"request": self.request}

class FollowView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, username):
        target_user = get_object_or_404(User, username=username)
        if target_user == request.user:
            return Response({"detail": "Você não pode seguir a si mesmo."}, status=400)
        request.user.profile.following.add(target_user.profile)
        return Response({"detail": f"Agora você segue {username}."}, status=200)
    def delete(self, request, username):
        target_user = get_object_or_404(User, username=username)
        request.user.profile.following.remove(target_user.profile)
        return Response({"detail": f"Você deixou de seguir {username}."}, status=200)
