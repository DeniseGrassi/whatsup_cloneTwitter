from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

def root_ok(_request):
    return JsonResponse({
        "status": "ok",
        "app": "whatsup-backend",
        "version": "v1",
        "try": ["/api/login/", "/api/register/", "/api/posts/", "/api/posts/feed/"]
    })

urlpatterns = [
    path("", root_ok),                 
    path("healthz/", lambda r: HttpResponse("ok")),  
    path("admin/", admin.site.urls),
    path("api/", include("users.urls")),
    path("api/", include("posts.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)