from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    UserProfileView,
    ProfileListView,
    ProfileView,
    FollowView,
)

urlpatterns = [
    # Autenticação
    path('register/', RegisterView.as_view(), name='register'),   # POST /api/register/
    path('login/',    LoginView.as_view(),    name='login'),      # POST /api/login/

    # Perfil do usuário autenticado (GET/PUT/PATCH)
    path('profile/me/',   UserProfileView.as_view(),   name='user-profile'),  # GET/PUT/PATCH

    # Lista de todos os perfis (só GET)
    path('profile/',      ProfileListView.as_view(),   name='profile-list'),  # GET

    # Perfil detalhado por username (só GET)
    path('profile/<str:username>/', ProfileView.as_view(), name='profile-detail'),  # GET
    
    # Seguir/Deixar de seguir usuário
    path('profile/<str:username>/follow/', FollowView.as_view(), name='follow'),
]


    # # perfil próprio (“me”):
    # path('me/',       UserProfileView.as_view(),   name='user-profile'),

    # # listar todos os perfis
    # path('',          ProfileListView.as_view(),   name='profile-list'),

    # # detalhe de qualquer perfil via username
    # path('<str:username>/', ProfileView.as_view(),  name='profile-detail'),