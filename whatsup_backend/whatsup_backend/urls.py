
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # suas rotas de API (cada app define seus caminhos internos)
    path("api/", include("users.urls")),
    path("api/", include("posts.urls")),
]

# servir uploads (MEDIA) — ok para este projeto no Heroku
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
