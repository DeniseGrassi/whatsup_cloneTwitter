from django.urls import path
from .views import (
    PostListCreateView, FeedView,
    CommentListView, CommentCreateView, PostDetailView,
    LikeToggleView, DislikeToggleView, RetweetView, ShareView, UserPostsView
)

urlpatterns = [
    path("posts/",                      PostListCreateView.as_view(), name="post-list-create"),
    path("posts/feed/",                 FeedView.as_view(),          name="feed"),
    path("posts/<int:pk>/",             PostDetailView.as_view(),    name="post-detail"),
    path("posts/<int:pk>/comments/",    CommentListView.as_view(),   name="comment-list"),
    path("posts/<int:pk>/comment/",     CommentCreateView.as_view(), name="comment-create"),
    path("posts/<int:pk>/like/",        LikeToggleView.as_view(),    name="like-toggle"),
    path("posts/<int:pk>/dislike/",     DislikeToggleView.as_view(), name="dislike-toggle"),
    path("posts/<int:pk>/retweet/",     RetweetView.as_view(),       name="retweet"),
    path("posts/<int:pk>/share/",       ShareView.as_view(),         name="share"),
    path("posts/user/<str:username>/",  UserPostsView.as_view(),     name="user-posts"),
]
