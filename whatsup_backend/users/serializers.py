# users/serializers.py

from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile
from posts.serializers import PostSerializer

class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ["username", "email", "password", "password2"]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "As senhas não conferem."})
        return data

    def create(self, validated_data):
        # remove o campo password2 antes de criar o User
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
    username = serializers.CharField(source='user.username', read_only=True)
    photo = serializers.ImageField(read_only=True)

    class Meta:
        model = UserProfile
        fields = ['username', 'photo']

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", required=True)
    email    = serializers.EmailField(source="user.email", required=True)
    bio      = serializers.CharField(required=False, allow_blank=True)
    photo    = serializers.ImageField(required=False, allow_null=True)
    posts    = PostSerializer(many=True, source="user.post_set", read_only=True)

    following        = UserMiniSerializer(many=True, read_only=True)
    followers        = UserMiniSerializer(many=True, read_only=True)
    following_count  = serializers.IntegerField(source='following.count', read_only=True)
    followers_count  = serializers.IntegerField(source='followers.count', read_only=True)
    
    posts = PostSerializer(many=True, source='user.post_set', read_only=True)

    class Meta:
        model  = UserProfile
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
        read_only_fields = ['following', 'followers', 'following_count', 'followers_count', 'posts']

    def update(self, instance, validated_data):
        # atualiza primeiro os campos do User
        user_data = validated_data.pop("user", {})
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()
        # depois atualiza o próprio UserProfile
        return super().update(instance, validated_data)

