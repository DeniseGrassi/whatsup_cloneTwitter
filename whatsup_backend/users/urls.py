from django.urls import path
from . import views
from .views import MeProfileView, ChangePasswordView

urlpatterns = [
    path("register/", views.RegisterView.as_view()),
    path("login/", views.LoginView.as_view()),

    # perfil do usuário logado
    path("profile/me/", MeProfileView.as_view(), name="profile-me"),
    path("profile/change-password/", ChangePasswordView.as_view(), name="change-password"),

    # demais rotas já existentes
    path("profile/suggested/", views.SuggestedProfilesView.as_view()),
    path("profile/", views.ProfileListView.as_view()),
    path("profile/<str:username>/follow/", views.FollowView.as_view()),
    path("profile/<str:username>/", views.ProfileView.as_view()),
]
