# fortn — app (React Native + Expo)

App multiplataforma de gestão financeira pessoal. Mobile-first (iPhone > Android > Web).
Consome a API do backend Next.js (pasta raiz do repositório).

## Arquitetura

```
src/
  app/          Telas (Expo Router): (auth)/ [inicio, cadastro/*, recuperar*],
                index (dashboard), extrato, nova, despesa/[id], editar/[id], perfil
  components/   UI reutilizável (Button, Card, Text, Field, SelectField, Toast, FAB...)
  features/     Domínios: auth/ (store de sessão, LoginSheet, StepScreen, OtpInput)
                e despesas/ (hooks React Query, DespesaForm, filtros)
  services/     http.ts (Bearer + refresh automático no 401), token-store (SecureStore)
  store/        Estado global leve (Zustand) — toast, visibility, intro
  theme/        Cores, tipografia, espaçamento (identidade fortn)
  types/        Tipos compartilhados
  utils/        Formatação, ícones de categoria
  constants/    Resolução da URL do backend
```

Stack: Expo Router · React Query · Zustand · React Hook Form · Reanimated 4 · expo-haptics.

## Autenticação

- Sessão hidratada no boot (`/api/auth/sessao`); guard no `_layout.tsx` decide
  entre as telas `(auth)` e o app.
- Tokens no SecureStore (keychain); refresh automático e transparente no 401.
- Cadastro em 4 etapas (dados → celular+código → e-mail → senha com checklist);
  recuperação de senha com auto-login.
- Sem provedor de SMS: o app mostra "código de teste" quando o backend está com
  `AUTH_DEV_RETORNA_CODIGO=true`.

## Como rodar

Mais fácil: `npm run dev:all` na **raiz** (sobe Docker + backend + este app).

Pré-requisito manual: o **backend** rodando na raiz (`npm run dev`, porta 3000)
e o Postgres no Docker (`fortn-db`). Para testar sem login, `AUTH_DISABLED=true` no `.env` da raiz.

Dentro de `mobile/`:

```bash
npm install          # primeira vez
npx expo start       # abre o Metro; leia o QR code no app Expo Go (iPhone)
npx expo start --web # roda no navegador (React Native Web)
```

- **iPhone físico:** instale o **Expo Go** na App Store, garanta que o celular está no mesmo
  Wi-Fi do PC e leia o QR code. O app descobre o IP do backend automaticamente (mesmo host do
  Metro, porta 3000). Libere a porta 3000 no firewall do Windows (regra "fortn dev 3000").
- **Web:** `npx expo start --web`.
- **Android emulador:** `npx expo start --android` (backend acessível via `10.0.2.2:3000`).

### Backend em outro endereço

Por padrão o app deriva a URL do backend do host do Metro. Para forçar outra URL, defina
`EXPO_PUBLIC_API_URL` (ex.: `EXPO_PUBLIC_API_URL=http://192.168.18.15:3000`) antes do `expo start`.
