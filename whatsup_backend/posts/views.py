from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models      import Post, Comment, Like
from .serializers import (
    PostSerializer,
    CommentSerializer,
    LikeSerializer,
    EmptySerializer
)
from .permissions import IsOwnerOrReadOnly


class PostCreateView(generics.CreateAPIView):
    queryset               = Post.objects.all()
    serializer_class       = PostSerializer
    permission_classes     = [IsAuthenticated]
    authentication_classes = [TokenAuthentication, SessionAuthentication]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FeedView(generics.ListAPIView):
    """
    GET /api/posts/feed/    Lista o feed filtrado por quem eu sigo (e meus próprios posts).
    """
    serializer_class       = PostSerializer
    permission_classes     = [IsAuthenticated]
    authentication_classes = [TokenAuthentication, SessionAuthentication]

    def get_queryset(self):
        following_ids = list(
            self.request.user.profile.following
                .values_list("user__id", flat=True)
        )
        # inclui meus posts
        following_ids.append(self.request.user.id)
        return Post.objects.filter(
            user__id__in=following_ids
        ).order_by("-created_at")


class CommentListView(generics.ListAPIView):
    """
    GET  /api/posts/{pk}/comments/  Lista comentários de um post.
    """
    serializer_class       = CommentSerializer
    permission_classes     = [IsAuthenticated]
    authentication_classes = [TokenAuthentication, SessionAuthentication]

    def get_queryset(self):
        post = get_object_or_404(Post, pk=self.kwargs["pk"])
        return post.comments.order_by("-created_at")


class CommentCreateView(APIView):
    """
    POST /api/posts/{pk}/comment/   Cria um comentário em um post 
    """
    permission_classes     = [IsAuthenticated]
    authentication_classes = [TokenAuthentication, SessionAuthentication]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, post=post)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LikeToggleView(APIView):
    """     
    POST /api/posts/{pk}/like/  Cria Like ou, se já existia, remove (unlike)
    """
    permission_classes     = [IsAuthenticated]
    authentication_classes = [TokenAuthentication, SessionAuthentication]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        like, created = Like.objects.get_or_create(
            user=request.user, post=post
        )
        if not created:
            # já tinha curtido -> desfaz
            like.delete()
            return Response({"detail": "Unliked"}, status=status.HTTP_204_NO_CONTENT)

        return Response({"detail": "Liked"}, status=status.HTTP_201_CREATED)
    
class DislikeToggleView(APIView):
    """
    POST /api/posts/{pk}/dislike/     Cria ou remove um Dislike.
    """
    permission_classes     = [IsAuthenticated]
    authentication_classes = [TokenAuthentication, SessionAuthentication]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        dislike, created = Dislike.objects.get_or_create(user=request.user, post=post)
        if not created:
            dislike.delete()
            return Response({"detail": "Removed dislike"}, status=status.HTTP_204_NO_CONTENT)
        return Response({"detail": "Disliked"}, status=status.HTTP_201_CREATED)

    

class RetweetView(APIView):
    """      
    POST /api/posts/{pk}/retweet/    Cria um retweet (novo post com parent=original).
    """
    permission_classes     = [IsAuthenticated]
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    serializer_class       = EmptySerializer

    def post(self, request, pk):
        original = get_object_or_404(Post, pk=pk)
        # não permitir retweet do mesmo tweet duas vezes pelo mesmo user
        already = Post.objects.filter(user=request.user, parent=original).exists()
        if already:
            return Response(
                {"detail": "Você já fez retweet deste tweet."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # cria o retweet
        retweet = Post.objects.create(
            user=request.user,
            content=original.content,  # ou deixar vazio: ""
            parent=original
        )
        serializer = PostSerializer(retweet)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

 

class ShareView(APIView):
    """    
    POST /api/posts/{pk}/share/    Cria um share (novo post referenciando o original).
    """
    permission_classes     = [IsAuthenticated]
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    serializer_class       = EmptySerializer  # libera o form no Browsable API

    def post(self, request, pk):
        original = get_object_or_404(Post, pk=pk)
        # cria o share (mesma lógica de retweet)
        share = Post.objects.create(
            user=request.user,
            content=original.content,
            parent=original
        )
        serializer = PostSerializer(share)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    


class UserPostsView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication, SessionAuthentication]

    def get_queryset(self):
        username = self.kwargs.get('username')
        User = get_user_model()
        user = get_object_or_404(User, username=username)
        return Post.objects.filter(user=user).order_by('-created_at')

