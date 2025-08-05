from rest_framework import serializers
from .models import Post, Comment, Like

class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "username", "content", "created_at"]


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ["id"]  # só o ID, para toggle/unlike


class PostSerializer(serializers.ModelSerializer):
    user            = serializers.StringRelatedField(read_only=True)
    likes_count     = serializers.IntegerField(source="likes.count", read_only=True)
    comments_count  = serializers.IntegerField(source="comments.count", read_only=True)
    retweets_count  = serializers.IntegerField(source="post_set.count", read_only=True)
    parent_detail   = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "user", "content", "created_at", "parent",
            "parent_detail", "likes_count", "comments_count", "retweets_count",
        ]
        read_only_fields = [
            "id", "user", "created_at",
            "likes_count", "comments_count", "retweets_count", "parent_detail",
        ]

    def get_parent_detail(self, obj):
        """
        Se for um retweet, trazer os dados básicos do post original.
        """
        if obj.parent:
            return {
                "id":        obj.parent.id,
                "user":      obj.parent.user.username,
                "content":   obj.parent.content,
                "created_at":obj.parent.created_at,
            }
        return None

class EmptySerializer(serializers.Serializer):
    """
    Serializer vazio, só para fazer a Browsable API
    liberar o formulário de POST no RetweetView.
    """
    pass