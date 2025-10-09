from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import UserProfile
from posts.serializers import PostSerializer

User = get_user_model()

# helper para URL absoluta
def _abs(req, url: str):
    return req.build_absolute_uri(url) if req else url


# ------------ edição do próprio perfil ------------
class MeProfileSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=False)
    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)

    # Aceita upload em 'avatar' (preferencial) e fallback 'photo'
    avatar = serializers.ImageField(required=False, allow_null=True, write_only=True)
    photo  = serializers.ImageField(required=False, allow_null=True, write_only=True)

    def to_representation(self, user):
        prof = getattr(user, "profile", None) or UserProfile.objects.get_or_create(user=user)[0]
        req = self.context.get("request")
        return {
            "username": user.username,
            "name": user.first_name or "",
            "email": user.email or "",
            "bio": prof.bio or "",
            "photo": (req.build_absolute_uri(prof.photo.url) if (req and prof.photo) else (prof.photo.url if prof.photo else None)),
        }

    def validate_username(self, value: str):
        user = self.context["request"].user
        if not value:
            raise serializers.ValidationError("Informe um @username.")
        if User.objects.filter(username__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Este @username já está em uso.")
        return value

    def update(self, instance, validated_data):
        # User
        if "username" in validated_data:
            instance.username = validated_data["username"]
        if "name" in validated_data:
            instance.first_name = validated_data.get("name", instance.first_name)
        if "email" in validated_data:
            instance.email = validated_data.get("email", instance.email)
        instance.save()

        # Profile
        prof, _ = UserProfile.objects.get_or_create(user=instance)
        if "bio" in validated_data:
            prof.bio = validated_data.get("bio", prof.bio)

        # arquivo pode vir como 'avatar' ou 'photo'
        file_obj = None
        if "avatar" in validated_data:
            file_obj = validated_data.get("avatar")
        elif "photo" in validated_data:
            file_obj = validated_data.get("photo")

        if "avatar" in validated_data or "photo" in validated_data:
            if file_obj is None:
                if prof.photo:
                    prof.photo.delete(save=False)
                prof.photo = None
            else:
                prof.photo = file_obj

        prof.save()
        return instance


# ------------ troca de senha ------------
class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({"current_password": "Senha atual inválida."})
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


# ------------ cadastro ------------
class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()

    # Aceita password OU password1/password2
    password = serializers.CharField(write_only=True, required=False, min_length=5)
    password1 = serializers.CharField(write_only=True, required=False, min_length=5)
    password2 = serializers.CharField(write_only=True, required=False, min_length=5)

    def validate_username(self, v):
        if User.objects.filter(username__iexact=v).exists():
            raise serializers.ValidationError("Este usuário já existe.")
        return v

    def validate_email(self, v):
        if User.objects.filter(email__iexact=v).exists():
            raise serializers.ValidationError("Este e-mail já está em uso.")
        return v

    def validate(self, attrs):
        # Normaliza: usa `password` se vier; senão tenta `password1`
        pwd = attrs.get("password") or attrs.get("password1")
        confirm = attrs.get("password2")

        if not pwd:
            # se não veio nenhuma forma de senha, erro
            raise serializers.ValidationError({"password": "Informe a senha."})

        # Se veio confirmação, valida
        if confirm is not None and pwd != confirm:
            raise serializers.ValidationError({"password2": "As senhas não conferem."})

        # Deixa só 'password' para o create()
        attrs["password"] = pwd
        attrs.pop("password1", None)
        attrs.pop("password2", None)
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class UserMiniSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    photo = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ["username", "photo"]

    def get_photo(self, obj):
        req = self.context.get("request")
        return _abs(req, obj.photo.url) if obj.photo else None


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
            "username", "email", "bio", "photo",
            "following", "followers", "following_count", "followers_count",
            "posts",
        ]

    def get_photo(self, obj):
        req = self.context.get("request")
        return _abs(req, obj.photo.url) if obj.photo else None


# ------------ update genérico (se você usa em algum lugar) ------------
class UserProfileUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", required=False)
    name = serializers.CharField(source="user.first_name", required=False, allow_blank=True)
    email = serializers.EmailField(source="user.email", required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = UserProfile
        fields = ["username", "name", "email", "bio", "photo"]

    def validate(self, attrs):
        user_data = attrs.get("user", {})
        new_username = user_data.get("username")
        if new_username:
            qs = User.objects.filter(username=new_username)
            inst: UserProfile = self.instance
            if inst and inst.user_id:
                qs = qs.exclude(pk=inst.user_id)
            if qs.exists():
                raise serializers.ValidationError({"username": "Este @username já está em uso."})
        return attrs

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        for attr, value in user_data.items():
            setattr(instance.user, attr, value)
        instance.user.save()
        return super().update(instance, validated_data)
