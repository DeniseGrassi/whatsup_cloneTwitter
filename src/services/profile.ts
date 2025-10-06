
export async function updateProfile(token: string, payload: { email?: string; bio?: string; photoFile?: File | null }) {
  const form = new FormData();
  if (payload.email !== undefined) form.append('email', payload.email);
  if (payload.bio !== undefined) form.append('bio', payload.bio);
  if (payload.photoFile) form.append('photo', payload.photoFile);

  const res = await fetch(`https://whatsup-backend-c00eef392a0f.herokuapp.com/users/profile/me/`, {
    method: 'PATCH',
    headers: { Authorization: `Token ${token}` }, // não setar Content-Type
    body: form
  });
  return res.json();
}
