# WhatsUp - Clone do Twitter 🐦

O **WhatsUp** é uma aplicação full stack inspirada no Twitter, desenvolvida com **Django REST Framework** no backend e **React/TypeScript** no frontend.  
O projeto implementa autenticação, perfis personalizados e interações sociais, permitindo criar posts, curtir, comentar, compartilhar e seguir outros usuários.

- **Frontend**: React + TypeScript (deploy na Vercel)  
- **Backend**: Django REST Framework + PostgreSQL (deploy no Heroku)  

---

## 🌐 Deploy

- **Frontend**: [WhatsUp App](https://whatsup-topaz.vercel.app/)  
- **Backend (API)**: [WhatsUp API](https://whatsup-backend-c00eef392a0f.herokuapp.com/api/)  

⚠️ Observação:  

A URL `/api/` retorna **404 (Not Found)** por padrão, pois não existe rota index configurada.  
Para testar, acesse diretamente os endpoints, como por exemplo:  

Base URL: https://whatsup-backend-c00eef392a0f.herokuapp.com/api/

Registro: https://whatsup-backend-c00eef392a0f.herokuapp.com/api/register/

Login: https://whatsup-backend-c00eef392a0f.herokuapp.com/api/login/

Feed (auth): https://whatsup-backend-c00eef392a0f.herokuapp.com/api/posts/feed/

Post por ID: https://whatsup-backend-c00eef392a0f.herokuapp.com/api/posts/<id>/

Comentários: https://whatsup-backend-c00eef392a0f.herokuapp.com/api/posts/<id>/comments/

Comentar (auth): https://whatsup-backend-c00eef392a0f.herokuapp.com/api/posts/<id>/comment/

Like (auth): https://whatsup-backend-c00eef392a0f.herokuapp.com/api/posts/<id>/like/

Dislike (auth): https://whatsup-backend-c00eef392a0f.herokuapp.com/api/posts/<id>/dislike/

Retweet (auth): https://whatsup-backend-c00eef392a0f.herokuapp.com/api/posts/<id>/retweet/

Share (auth): https://whatsup-backend-c00eef392a0f.herokuapp.com/api/posts/<id>/share/

Perfis: https://whatsup-backend-c00eef392a0f.herokuapp.com/api/profile/

Perfil por username: https://whatsup-backend-c00eef392a0f.herokuapp.com/api/profile/<username>/

Meu perfil (auth): https://whatsup-backend-c00eef392a0f.herokuapp.com/api/profile/me/

Seguir (auth): https://whatsup-backend-c00eef392a0f.herokuapp.com/api/profile/<username>/follow/

---

## ✨ Funcionalidades

- Criação e autenticação de contas (com token JWT)
- Edição de perfil (foto, nome, bio)
- Seguir e deixar de seguir usuários
- Criação de posts e retweets
- Curtir, descurtir, comentar e compartilhar posts
- Feed personalizado com posts dos usuários seguidos

---

## 🛠️ Tecnologias

**Frontend**
- React 18
- TypeScript
- Styled Components
- React Router DOM
- Axios

**Backend**
- Django 5
- Django REST Framework
- PostgreSQL
- Gunicorn + Whitenoise
- Deploy no Heroku

---

## 🚀 Como rodar localmente

### Backend
```bash
git clone https://github.com/DeniseGrassi/whatsup_cloneTwitter.git
cd whatsup_cloneTwitter/whatsup_backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd whatsup_cloneTwitter
npm install
npm start

```
🔗 Endpoints da API

Base URL: https://whatsup-backend-c00eef392a0f.herokuapp.com/api/

| **Recurso** | **Método**    | **Endpoint**                  | **Descrição**                                 | **Auth** |
| ----------- | ------------- | ----------------------------- | --------------------------------------------- | -------- |
| **Auth**    | POST          | `/register/`                  | Criar usuário (username, password, email)     | ❌        |
|             | POST          | `/login/`                     | Login com usuário e senha → retorna token JWT | ❌        |
| **Perfil**  | GET           | `/profile/`                   | Lista todos os perfis                         | ❌        |
|             | GET           | `/profile/<username>/`        | Detalhe de um perfil específico               | ❌        |
|             | GET/PUT/PATCH | `/profile/me/`                | Visualizar/editar perfil do usuário logado    | ✅        |
|             | POST          | `/profile/<username>/follow/` | Seguir ou deixar de seguir usuário            | ✅        |
| **Posts**   | POST          | `/posts/`                     | Criar novo post                               | ✅        |
|             | GET           | `/posts/feed/`                | Feed de posts dos usuários seguidos           | ✅        |
|             | GET           | `/posts/<id>/`                | Detalhar um post específico                   | ❌        |
|             | GET           | `/posts/<id>/comments/`       | Listar comentários de um post                 | ❌        |
|             | POST          | `/posts/<id>/comment/`        | Criar comentário em um post                   | ✅        |
|             | POST          | `/posts/<id>/like/`           | Curtir/descurtir um post                      | ✅        |
|             | POST          | `/posts/<id>/dislike/`        | Dar "dislike" em um post                      | ✅        |
|             | POST          | `/posts/<id>/retweet/`        | Retweetar um post                             | ✅        |
|             | POST          | `/posts/<id>/share/`          | Compartilhar post                             | ✅        |
|             | GET           | `/posts/user/<username>/`     | Listar posts de um usuário específico         | ❌        |






