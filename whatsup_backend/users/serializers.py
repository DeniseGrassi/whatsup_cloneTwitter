from django.contrib.auth.models import User
from rest_framework import serializers

from .models import UserProfile
from posts.serializers import PostSerializer


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2"]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "As senhas não conferem."})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email"),
            password=validated_data["password"],
        )
        
        UserProfile.objects.get_or_create(user=user)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)


class UserMiniSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    photo = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ["username", "photo"]

    def get_photo(self, obj):
        if not obj.photo:
            return None
        request = self.context.get("request")
        url = obj.photo.url  
        return request.build_absolute_uri(url) if request else url


# --------- Serializer de LEITURA ----------
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    bio = serializers.CharField(read_only=True)
    photo = serializers.SerializerMethodField()

    following = UserMiniSerializer(many=True, read_only=True)
    followers = UserMiniSerializer(many=True, read_only=True)
    following_count = serializers.IntegerField(source="following.count", read_only=True)
    followers_count = serializers.IntegerField(source="followers.count", read_only=True)

    posts = PostSerializer(many=True, source="user.post_set", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "email",
            "bio",
            "photo",
            "following",
            "followers",
            "following_count",
            "followers_count",
            "posts",
        ]

    def get_photo(self, obj):
        if not obj.photo:
            return None
        request = self.context.get("request")
        url = obj.photo.url
        return request.build_absolute_uri(url) if request else url


# --------- Serializer de ESCRITA (update) ----------
class UserProfileUpdateSerializer(serializers.ModelSerializer):
    # campos editáveis:
    email = serializers.EmailField(source="user.email", required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = UserProfile
        fields = ["email", "bio", "photo"]

    def update(self, instance, validated_data):
        # atualiza User (e-mail)
        user_data = validated_data.pop("user", {})
        for attr, value in user_data.items():
            setattr(instance.user, attr, value)
        instance.user.save()

        # atualiza Profile (bio/foto)
        return super().update(instance, validated_data)
