from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.filters import SearchFilter

from .models import UserProfile
from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
)

User = get_user_model()


class RegisterView(APIView):
    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        if ser.is_valid():
            user = ser.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({"token": token.key}, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        username_or_email = request.data.get("username")
        password = request.data.get("password")

        # permite e-mail
        if "@" in (username_or_email or ""):
            user = User.objects.filter(email__iexact=username_or_email).first()
            if user:
                username_or_email = user.username

        user = authenticate(username=username_or_email, password=password)
        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({"token": token.key})
        return Response({"error": "Credenciais inválidas"}, status=status.HTTP_401_UNAUTHORIZED)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)  

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        data = UserProfileSerializer(profile, context={"request": request}).data
        return Response(data)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        ser = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            data = UserProfileSerializer(profile, context={"request": request}).data
            return Response(data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        ser = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            data = UserProfileSerializer(profile, context={"request": request}).data
            return Response(data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


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
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        
        me, _ = UserProfile.objects.get_or_create(user=self.request.user)
        following_ids = me.following.values_list("id", flat=True)

        return (
            UserProfile.objects
            .exclude(id__in=list(following_ids) + [me.id])  
            .select_related("user")
            .order_by("-id")[:20]  
        )

    def get_serializer_context(self):
        return {"request": self.request}

class FollowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        target_user = get_object_or_404(User, username=username)
        if target_user == request.user:
            return Response(
                {"detail": "Você não pode seguir a si mesmo."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.profile.following.add(target_user.profile)
        return Response({"detail": f"Agora você segue {username}."}, status=status.HTTP_200_OK)

    def delete(self, request, username):
        target_user = get_object_or_404(User, username=username)
        request.user.profile.following.remove(target_user.profile)
        return Response({"detail": f"Você deixou de seguir {username}."}, status=status.HTTP_200_OK)
