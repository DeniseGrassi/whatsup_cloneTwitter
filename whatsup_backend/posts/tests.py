from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from posts.models import Post, Comment, Like

class PostAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="fulano", password="123abc")
        self.user2 = User.objects.create_user(username="ciclano", password="123abc")
        self.client.login(username="fulano", password="123abc")  # autentica user1

    def test_create_post(self):
        url = reverse('post-create')
        data = {"content": "Meu primeiro tweet!"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.count(), 1)

    def test_feed_only_following_and_self(self):
        # Fulano posta algo
        Post.objects.create(user=self.user, content="post do fulano")
        # Ciclano posta algo
        Post.objects.create(user=self.user2, content="post do ciclano")
        # Fulano segue Ciclano
        self.user.profile.following.add(self.user2.profile)
        url = reverse('feed')
        response = self.client.get(url)
        contents = [p["content"] for p in response.data]
        self.assertIn("post do fulano", contents)
        self.assertIn("post do ciclano", contents)

    def test_like_and_unlike(self):
        post = Post.objects.create(user=self.user, content="Post curtível")
        url = reverse('like-toggle', kwargs={"pk": post.pk})
        # Like
        resp1 = self.client.post(url)
        self.assertIn("Liked", str(resp1.data) + str(resp1.content))
        # Unlike
        resp2 = self.client.post(url)
        self.assertIn("Unliked", str(resp2.data) + str(resp2.content))

    def test_comment_post(self):
        post = Post.objects.create(user=self.user, content="Comente aqui")
        url = reverse('comment-create', kwargs={"pk": post.pk})
        data = {"content": "Um comentário!"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.count(), 1)

    def test_retweet(self):
        post = Post.objects.create(user=self.user, content="Retwitte isto!")
        url = reverse('retweet', kwargs={"pk": post.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.count(), 2)  # original + retweet

    def test_list_posts_by_user(self):
        Post.objects.create(user=self.user, content="tweet 1")
        Post.objects.create(user=self.user, content="tweet 2")
        url = reverse('user-posts', kwargs={"username": self.user.username})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
        self.assertTrue(all(p['user'] == self.user.username for p in response.data))
