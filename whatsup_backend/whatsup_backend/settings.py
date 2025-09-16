import os
from pathlib import Path
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# -------------------------------------------------
# Segurança / Debug
# -------------------------------------------------
# Em produção, configure no Heroku:
#   heroku config:set DEBUG=False
DEBUG = os.getenv("DEBUG", "False") == "True"

# Em produção, **não** deixe a SECRET_KEY hard-coded!
#   heroku config:set SECRET_KEY="sua_chave_super_secreta"
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-s&)q@ar2qk+gpux=&c7_ls&jgio5u_jhs$3tuia3w+#(hsmqjz",
)

# -------------------------------------------------
# Hosts
# -------------------------------------------------
ALLOWED_HOSTS = [
    "whatsup-backend-c00eef392a0f.herokuapp.com",  
    ".vercel.app",                                  
    "localhost",
    "127.0.0.1",
]

# -------------------------------------------------
# Apps
# -------------------------------------------------
INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Terceiros
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "whitenoise.runserver_nostatic", 

    # apps
    "users.apps.UsersConfig",
    "posts",
]

# -------------------------------------------------
# Middleware
# -------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# -------------------------------------------------
# CORS / CSRF (frontend Vercel)
# -------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "https://whatsup-topaz.vercel.app",  
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]

CSRF_TRUSTED_ORIGINS = [
    "https://whatsup-topaz.vercel.app",
    "https://*.vercel.app",
    "https://*.herokuapp.com",
    "https://localhost",
    "https://127.0.0.1",
]

# -------------------------------------------------
# URLs / Templates / WSGI
# -------------------------------------------------
ROOT_URLCONF = "whatsup_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "whatsup_backend.wsgi.application"

# -------------------------------------------------
# Banco de Dados (Heroku + fallback local)
# -------------------------------------------------
DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=600,
    )
}

# -------------------------------------------------
# Autenticação / DRF
# -------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        # Se quiser forçar login por padrão:
        # "rest_framework.permissions.IsAuthenticated",
        "rest_framework.permissions.AllowAny",
    ],
}

# -------------------------------------------------
# Internacionalização
# -------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# -------------------------------------------------
# Arquivos Estáticos (Whitenoise)
# -------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Django 4.2+: use STORAGES em vez de STATICFILES_STORAGE
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Heroku faz proxy https -> http: isso garante request.is_secure()
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

# -------------------------------------------------
# Media (se usar uploads locais)
# -------------------------------------------------
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# -------------------------------------------------
# PK default
# -------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
