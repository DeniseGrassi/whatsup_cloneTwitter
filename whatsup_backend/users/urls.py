from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view()),
    path("login/", views.LoginView.as_view()),
    path("profile/me/", views.UserProfileView.as_view()),
    path("profile/", views.ProfileListView.as_view()),
    path("profile/<str:username>/", views.ProfileView.as_view()),
    path("profile/<str:username>/follow/", views.FollowView.as_view()),
]
