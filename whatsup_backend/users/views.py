
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser   
from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import get_object_or_404

from .models import UserProfile
from .serializers import RegisterSerializer, UserProfileSerializer

User = get_user_model()

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key})
        return Response({'error': 'Credenciais inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)  # aceita upload de arquivo

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        ser = UserProfileSerializer(profile, context={"request": request})  
        return Response(ser.data)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        ser = UserProfileSerializer(profile, data=request.data, partial=True, context={"request": request})   
        if ser.is_valid():
            ser.save()
            return Response(UserProfileSerializer(profile, context={"request": request}).data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        ser = UserProfileSerializer(profile, data=request.data, partial=True, context={"request": request})  
        if ser.is_valid():
            ser.save()
            return Response(UserProfileSerializer(profile, context={"request": request}).data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileListView(generics.ListAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    def get_serializer_context(self):  # <<<<<<
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

class ProfileView(generics.RetrieveAPIView):
    queryset = UserProfile.objects.select_related('user')
    serializer_class = UserProfileSerializer
    lookup_field = 'user__username'
    lookup_url_kwarg = 'username'
    def get_serializer_context(self):  # <<<<<<
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
