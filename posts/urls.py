from django.urls import path
from .views import (
    PostCreateView, FeedView,
    CommentListView, CommentCreateView, PostDetailView,
    LikeToggleView, DislikeToggleView, RetweetView, ShareView, UserPostsView
)

urlpatterns = [
    path("", PostCreateView.as_view(), name="post-create"),
    path("feed/", FeedView.as_view(), name="feed"),
    path('<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path("<int:pk>/comments/", CommentListView.as_view(), name="comment-list"),
    path("<int:pk>/comment/",  CommentCreateView.as_view(), name="comment-create"),
    path("<int:pk>/like/",     LikeToggleView.as_view(),   name="like-toggle"),
    path("<int:pk>/dislike/",  DislikeToggleView.as_view()),    
    path("<int:pk>/retweet/",  RetweetView.as_view(),      name="retweet"),
    path("<int:pk>/share/",    ShareView.as_view()), 
    path('user/<str:username>/', UserPostsView.as_view(), name='user-posts'),
]
