// src/services/profile.ts
import api from "./api";

export async function getMe() {
  const { data } = await api.get("/profile/me/");
  return data;
}

type JsonPatch = {
  username?: string;
  name?: string;
  email?: string;
  bio?: string;
};

type PatchOptions = {
  removeAvatar?: boolean; // força remover a foto
};

// Envia como veio: JSON ou FormData. Não force Content-Type!
export async function patchMe(
  payload: JsonPatch | FormData = {},
  opts: PatchOptions = {}
) {
  // Caso 1: payload já é FormData (quando tem arquivo)
  if (payload instanceof FormData) {
    if (opts.removeAvatar) payload.append("avatar", ""); // remover
    const { data } = await api.patch("/profile/me/", payload);
    return data;
  }

  // Caso 2: JSON sem arquivo; se remover, vira FormData
  if (opts.removeAvatar) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ""));
    fd.append("avatar", ""); // sinaliza remoção
    const { data } = await api.patch("/profile/me/", fd);
    return data;
  }

  // JSON puro (back aceita JSON por causa do JSONParser)
  const { data } = await api.patch("/profile/me/", payload);
  return data;
}

export async function changePassword(current_password: string, new_password: string) {
  await api.post("/profile/change-password/", { current_password, new_password });
}
