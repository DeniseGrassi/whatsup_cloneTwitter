import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { getMe, patchMe, changePassword } from "../services/profile";
import fotoAvatar from "../foto_avatar.avif";
import { useAuth } from "../context/AuthContext";
import { resolveMediaUrl } from "../services/api";

type Props = { onUpdated?: () => void; onUsernameChanged?: (u: string) => void };

const EditCard = styled.div`
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  min-width: 0;
  & * { box-sizing: border-box; max-width: 100%; }
`;
const Title = styled.h4`margin:0 0 8px;font-size:16px;font-weight:700;color:#1f2a44;`;
const FormStack = styled.form`display:grid;gap:10px;`;
const Field = styled.label`display:grid;gap:6px;font-size:12px;color:#666;`;
const Input = styled.input`
  height:36px;border:1px solid #dcdcdc;border-radius:10px;padding:0 12px;font-size:14px;outline:none;
  &:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.15);}
`;
const TextArea = styled.textarea`
  min-height:88px;border:1px solid #dcdcdc;border-radius:10px;padding:10px 12px;resize:vertical;font-size:14px;outline:none;
  &:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.15);}
`;
const Row = styled.div`display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0;> * {min-width:0;}`;
const Avatar = styled.img`width:44px;height:44px;border-radius:999px;object-fit:cover;border:1px solid #e6e6e6;background:#fafafa;`;
const FileLabel = styled.label`
  display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 12px;
  border:1px dashed #c9c9c9;border-radius:10px;cursor:pointer;font-size:13px;
  &:hover{background:#faf8ff;border-color:#b9a4f9;}
`;
const HiddenFile = styled.input.attrs({ type: "file" })`display:none;`;
const PrimaryBtn = styled.button`
  height:38px;border:0;border-radius:10px;padding:0 14px;font-weight:600;background:#8b5cf6;color:#fff;cursor:pointer;width:100%;
  &:disabled{opacity:.6;cursor:not-allowed;} &:hover:not(:disabled){filter:brightness(1.05);}
`;
const GhostBtn = styled.button`
  height:32px;border:1px solid #e6e6e6;background:#fff;color:#444;padding:0 10px;border-radius:8px;cursor:pointer;
  &:hover{background:#f7f7f7;}
`;
const ErrorBox = styled.div`
  background:#fdecee;color:#b42318;border:1px solid #f3b4b9;border-radius:10px;padding:8px 10px;font-size:13px;
`;
export default function EditProfileBox({ onUpdated, onUsernameChanged }: Props) {
  const { updateUsername } = useAuth();

  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // undefined = não enviar; null = remover; File = trocar
  const [username, setUsername] = useState<string | undefined>();
  const [name, setName] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const [bio, setBio] = useState<string | undefined>();
  const [photo, setPhoto] = useState<File | null | undefined>();
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const data = await getMe();
      setMe(data);
      setLoading(false);
    })();
  }, []);

  // libera o blob URL antigo para evitar vazamento de memória
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onPick(file?: File | null) {
    // limpa prévia antiga
    if (preview) URL.revokeObjectURL(preview);

    if (file instanceof File) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    } else if (file === null) {
      setPhoto(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } else {
      setPhoto(undefined);
    }
  }

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    try {
      // 1) Remover foto explicitamente
      if (photo === null) {
        const updated = await patchMe({}, { removeAvatar: true });
        setMe(bustPhotoCache(updated));
        setPhoto(undefined);
        onUpdated?.();
        return;
      }

      // 2) Campos textuais (quando não houver arquivo novo)
      const baseData: Record<string, any> = {};
      if (username !== undefined) baseData.username = username.trim();
      if (name !== undefined) baseData.name = name;
      if (email !== undefined) baseData.email = email;
      if (bio !== undefined) baseData.bio = bio;

      // 3) Se houver arquivo, enviar como FormData na chave "avatar"
      let payload: any = baseData;
      if (photo instanceof File) {
        const fd = new FormData();
        Object.entries(baseData).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        fd.append("avatar", photo); // nome que o backend aceita
        payload = fd;
      }

      const updated = await patchMe(payload);
      setMe(bustPhotoCache(updated));
      setPhoto(undefined);

      // se mudou o @, sincroniza
      if (updated?.username && updated.username !== me?.username) {
        updateUsername(updated.username);
        onUsernameChanged?.(updated.username);
      }
      onUpdated?.();
    } catch (error: any) {
      const msg =
        error?.response?.data?.username?.[0] ||
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        "Falha ao salvar. Tente novamente.";
      setErr(msg);
    }
  }

  function bustPhotoCache(updated: any) {
    const abs = resolveMediaUrl(updated?.photo);
    return {
      ...updated,
      photo: abs ? `${abs}?v=${Date.now()}` : null,
    };
  }

  async function onChangePwd(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const current = (form.elements.namedItem("cur") as HTMLInputElement).value;
    const next = (form.elements.namedItem("new") as HTMLInputElement).value;
    try {
      await changePassword(current, next);
      (form.elements.namedItem("cur") as HTMLInputElement).value = "";
      (form.elements.namedItem("new") as HTMLInputElement).value = "";
      alert("Senha atualizada!");
    } catch (error: any) {
      const msg =
        error?.response?.data?.current_password?.[0] ||
        error?.response?.data?.detail ||
        "Não foi possível alterar a senha.";
      alert(msg);
    }
  }

  if (loading) return <EditCard>Carregando…</EditCard>;


  return (
    <>
      <EditCard>
        <Title>Editar perfil</Title>
        {err && <ErrorBox>{err}</ErrorBox>}

        <FormStack onSubmit={onSaveProfile}>
          <Field>
            @username (opcional)
            <Input
              placeholder={me?.username || "seu_usuario"}
              value={username ?? ""}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => {
                if ((username ?? "") === (me?.username || "")) setUsername(undefined);
              }}
            />
          </Field>

          <Field>
            Nome (opcional)
            <Input
              placeholder={me?.name || "Seu nome"}
              value={name ?? ""}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if ((name ?? "") === (me?.name || "")) setName(undefined);
              }}
            />
          </Field>

          <Field>
            E-mail (opcional)
            <Input
              type="email"
              placeholder={me?.email || "Seu e-mail"}
              value={email ?? ""}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if ((email ?? "") === (me?.email || "")) setEmail(undefined);
              }}
            />
          </Field>

          <Field>
            Bio (opcional)
            <TextArea
              placeholder={me?.bio || "Sua bio"}
              value={bio ?? ""}
              onChange={(e) => setBio(e.target.value)}
              onBlur={() => {
                if ((bio ?? "") === (me?.bio || "")) setBio(undefined);
              }}
            />
          </Field>

          <Field>
            Foto de perfil (opcional)
            <Row>
              <Avatar
                src={
                  preview
                    ? preview
                    : me?.photo
                      ? resolveMediaUrl(me.photo) || fotoAvatar
                      : fotoAvatar
                }
                alt="avatar"
              />

              <FileLabel htmlFor="photo-input">Escolher arquivo</FileLabel>
              <HiddenFile
                ref={fileRef}
                id="photo-input"
                accept="image/*"
                onChange={(e) => onPick(e.target.files?.[0])}
              />
              <GhostBtn type="button" onClick={() => onPick(null)}>Remover foto</GhostBtn>
            </Row>
          </Field>

          <PrimaryBtn type="submit">Salvar alterações</PrimaryBtn>
        </FormStack>
      </EditCard>

      <EditCard>
        <Title>Alterar senha (opcional)</Title>
        <FormStack onSubmit={onChangePwd}>
          <Field>
            Senha atual
            <Input name="cur" type="password" />
          </Field>
          <Field>
            Nova senha
            <Input name="new" type="password" />
          </Field>
          <PrimaryBtn type="submit">Atualizar senha</PrimaryBtn>
        </FormStack>
      </EditCard>
    </>
  );
}
