from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User

class UserAuthTests(APITestCase):

    def test_register_user(self):
        url = reverse('register')
        data = {
            "username": "testuser",
            "email": "testuser@email.com",
            "password": "testpassword123",
            "password2": "testpassword123",
        }
        response = self.client.post(url, data, format='json')
        print("ERRO:", response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)

    def test_login_user(self):
        # Primeiro, cria o usuário
        user = User.objects.create_user(username="testuser2", password="testpassword123")
        url = reverse('login')
        data = {
            "username": "testuser2",
            "password": "testpassword123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
