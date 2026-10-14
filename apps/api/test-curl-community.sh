#!/bin/bash
set -euo pipefail

PORT=3333
BASE_URL="http://127.0.0.1:${PORT}"
DB_URL="postgresql://postgres:postgres@localhost:5432/ancora_db"

echo "=========================================================="
echo "    BATERIA DE TESTES FUNCIONAIS VIA CURL - TASK-403B     "
echo "=========================================================="

# 1. Verifica se a API está respondendo no healthcheck
echo -e "\n[0/8] Verificando conectividade da API..."
HEALTH=$(curl -s "${BASE_URL}/health" || true)
if [[ -z "$HEALTH" || "$HEALTH" != *"ok"* ]]; then
  echo "❌ API não está respondendo em ${BASE_URL}/health. Inicie a API antes de rodar o teste."
  exit 1
fi
echo "✅ API online e saudável: ${HEALTH}"

# 2. Registrar Usuário A (Novo - Período de Escuta)
echo -e "\n[1/8] Registrando Usuário A (Recém-criado - Período de Escuta de 24h)..."
RESP_USER_A=$(curl -s -X POST "${BASE_URL}/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "SenhaForte123456!",
    "isAdult": true,
    "persona": "navegador",
    "termsVersion": "2026.1",
    "privacyPolicyVersion": "2026.1",
    "healthDataConsent": true
  }')

TOKEN_A=$(node -e "console.log((${RESP_USER_A}).data.accessToken)")
USER_A_ID=$(node -e "console.log((${RESP_USER_A}).data.user.id)")
echo "✅ Usuário A criado com sucesso. ID: ${USER_A_ID}"

# 3. Registrar Usuário B (Veterano - Liberado para postar)
echo -e "\n[2/8] Registrando Usuário B (Veterano - createdAt ajustado para 2 dias atrás)..."
RESP_USER_B=$(curl -s -X POST "${BASE_URL}/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "SenhaForte123456!",
    "isAdult": true,
    "persona": "navegador",
    "termsVersion": "2026.1",
    "privacyPolicyVersion": "2026.1",
    "healthDataConsent": true
  }')

TOKEN_B=$(node -e "console.log((${RESP_USER_B}).data.accessToken)")
USER_B_ID=$(node -e "console.log((${RESP_USER_B}).data.user.id)")
PEPPER="ancora-pepper-segredo-de-alta-entropia-lgpd-2026-min-32-chars"
ACCOUNT_TOKEN_B=$(node -e "const crypto = require('crypto'); console.log(crypto.createHmac('sha256', '${PEPPER}').update('${USER_B_ID}').digest('hex'));")

# Atualiza createdAt no banco para 2 dias atrás para o Usuário B
docker exec -i stackforge-postgres psql -U postgres -d ancora_db -c "
  UPDATE recovery_core.profiles 
  SET created_at = (now() AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '2 days'
  WHERE account_token = '${ACCOUNT_TOKEN_B}';
" > /dev/null
echo "✅ Usuário B criado e promovido para veterano (>24h). ID: ${USER_B_ID}"

# 4. Registrar Usuário C (Terceiro - para testar 403 no DELETE)
echo -e "\n[3/8] Registrando Usuário C (Terceiro usuário)..."
RESP_USER_C=$(curl -s -X POST "${BASE_URL}/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "SenhaForte123456!",
    "isAdult": true,
    "persona": "navegador",
    "termsVersion": "2026.1",
    "privacyPolicyVersion": "2026.1",
    "healthDataConsent": true
  }')

TOKEN_C=$(node -e "console.log((${RESP_USER_C}).data.accessToken)")
echo "✅ Usuário C criado com sucesso."

# 5. TESTE: Período de Escuta de 24h Reais (HTTP 403 LISTENING_PERIOD_ACTIVE)
echo -e "\n[4/8] TESTE 1: Tentativa de postagem por Usuário A no Período de Escuta (<24h)..."
HTTP_CODE_ESCUTA=$(curl -s -o /tmp/resp_escuta.json -w "%{http_code}" \
  -X POST "${BASE_URL}/api/v1/community/posts" \
  -H "Authorization: Bearer ${TOKEN_A}" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "FACO",
    "chipIds": ["morn_coffee_01"]
  }')

echo "HTTP Code: ${HTTP_CODE_ESCUTA}"
cat /tmp/resp_escuta.json
echo ""
if [[ "$HTTP_CODE_ESCUTA" == "403" && "$(cat /tmp/resp_escuta.json)" == *"LISTENING_PERIOD_ACTIVE"* ]]; then
  echo "✅ APROVADO: Bloqueio do Período de Escuta de 24h funcionando perfeitamente (HTTP 403)."
else
  echo "❌ FALHOU: Esperava HTTP 403 com LISTENING_PERIOD_ACTIVE."
  exit 1
fi

# 6. TESTE: Validação estrita por categoria (rejeita chip cruzado)
echo -e "\n[5/8] TESTE 2: Tentativa de postar chip de EVITO em categoria FACO..."
HTTP_CODE_CHIP=$(curl -s -o /tmp/resp_chip.json -w "%{http_code}" \
  -X POST "${BASE_URL}/api/v1/community/posts" \
  -H "Authorization: Bearer ${TOKEN_B}" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "FACO",
    "chipIds": ["avoid_env_bars_01"]
  }')

echo "HTTP Code: ${HTTP_CODE_CHIP}"
cat /tmp/resp_chip.json
echo ""
if [[ "$HTTP_CODE_CHIP" == "400" && "$(cat /tmp/resp_chip.json)" == *"não é válido para a categoria FACO"* ]]; then
  echo "✅ APROVADO: Validação cruzada estrita de chips funcionando (HTTP 400)."
else
  echo "❌ FALHOU: Esperava HTTP 400 com erro de validação de chip."
  exit 1
fi

# 7. TESTE: Post Válido com Idempotency-Key e Anonimato Padrão EVITO
echo -e "\n[6/8] TESTE 3: Criação de post EVITO com Idempotency-Key e retry..."
IDEM_KEY="test-key-$(date +%s)-$RANDOM"

HTTP_CODE_POST1=$(curl -s -o /tmp/resp_post1.json -w "%{http_code}" \
  -X POST "${BASE_URL}/api/v1/community/posts" \
  -H "Authorization: Bearer ${TOKEN_B}" \
  -H "Idempotency-Key: ${IDEM_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "EVITO",
    "chipIds": ["avoid_env_bars_01"]
  }')

echo "Tentativa 1 - HTTP Code: ${HTTP_CODE_POST1}"
cat /tmp/resp_post1.json
echo ""

POST1_ID=$(node -e "console.log(require('/tmp/resp_post1.json').data.post.id)")
IS_ANON=$(node -e "console.log(require('/tmp/resp_post1.json').data.post.isAnonymous)")

if [[ "$HTTP_CODE_POST1" == "201" && "$IS_ANON" == "true" ]]; then
  echo "✅ APROVADO: Post EVITO criado com sucesso com anonimato padrão (isAnonymous: true)."
else
  echo "❌ FALHOU: Post 1 não retornou 201 ou isAnonymous não é true."
  exit 1
fi

# Retry com a mesma Idempotency-Key
HTTP_CODE_RETRY=$(curl -s -o /tmp/resp_retry.json -w "%{http_code}" \
  -X POST "${BASE_URL}/api/v1/community/posts" \
  -H "Authorization: Bearer ${TOKEN_B}" \
  -H "Idempotency-Key: ${IDEM_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "EVITO",
    "chipIds": ["avoid_env_bars_01"]
  }')

echo "Tentativa 2 (Retry) - HTTP Code: ${HTTP_CODE_RETRY}"
cat /tmp/resp_retry.json
echo ""
POST1_RETRY_ID=$(node -e "console.log(require('/tmp/resp_retry.json').data.post.id)")

if [[ "$HTTP_CODE_RETRY" == "201" && "$POST1_ID" == "$POST1_RETRY_ID" ]]; then
  echo "✅ APROVADO: Idempotency-Key retornou resposta cacheada idêntica (HTTP 201)."
else
  echo "❌ FALHOU: Retry não retornou mesmo post ID."
  exit 1
fi

# 8. TESTE: Teto de 3 posts/dia
echo -e "\n[7/8] TESTE 4: Esgotando cota diária de 3 posts/dia e testando HTTP 429..."

# Post 2: FACO
curl -s -o /dev/null -X POST "${BASE_URL}/api/v1/community/posts" \
  -H "Authorization: Bearer ${TOKEN_B}" \
  -H "Content-Type: application/json" \
  -d '{ "category": "FACO", "chipIds": ["morn_coffee_01"] }'
echo "Post 2 criado (FACO)."

# Post 3: ME_AJUDA
curl -s -o /dev/null -X POST "${BASE_URL}/api/v1/community/posts" \
  -H "Authorization: Bearer ${TOKEN_B}" \
  -H "Content-Type: application/json" \
  -d '{ "category": "ME_AJUDA", "chipIds": ["help_tool_breathe_01"] }'
echo "Post 3 criado (ME_AJUDA)."

# Post 4: Deve ser BLOQUEADO com HTTP 429
HTTP_CODE_POST4=$(curl -s -o /tmp/resp_post4.json -w "%{http_code}" \
  -X POST "${BASE_URL}/api/v1/community/posts" \
  -H "Authorization: Bearer ${TOKEN_B}" \
  -H "Content-Type: application/json" \
  -d '{ "category": "FACO", "chipIds": ["mov_bike_01"] }' || true)

echo "Post 4 - HTTP Code: ${HTTP_CODE_POST4}"
cat /tmp/resp_post4.json
echo ""

if [[ "$HTTP_CODE_POST4" == "429" && "$(cat /tmp/resp_post4.json)" == *"Você já fez suas 3 partilhas de hoje"* ]]; then
  echo "✅ APROVADO: Trava atômica de cota diária (3 posts/dia) respondeu HTTP 429."
else
  echo "❌ FALHOU: Esperava HTTP 429 com mensagem de cota esgotada."
  exit 1
fi

# 9. TESTE: Leitura do Feed Comunitário (GET /feed)
echo -e "\n[8/8] TESTE 5: Consulta ao Feed Comunitário e verificação de métricas de vaidade..."
RESP_FEED=$(curl -s -X GET "${BASE_URL}/api/v1/community/feed" \
  -H "Authorization: Bearer ${TOKEN_B}")

echo "Amostra do feed retornado:"
echo "$RESP_FEED" | head -n 30
echo ""

# Verifica ausência de saved_count, support_count e profile_id
if [[ "$RESP_FEED" != *"saved_count"* && "$RESP_FEED" != *"support_count"* && "$RESP_FEED" != *"savedCount"* && "$RESP_FEED" != *"supportCount"* && "$RESP_FEED" != *"profile_id"* && "$RESP_FEED" != *"profileId"* ]]; then
  echo "✅ APROVADO: Feed suprime sumariamente saved_count, support_count e profile_id (Horizontalidade Radical)."
else
  echo "❌ FALHOU: Métricas de vaidade ou profile_id encontrados no payload do feed."
  exit 1
fi

# 10. TESTE: Deleção por terceiro proibida (HTTP 403) e deleção pelo autor (HTTP 200)
echo -e "\n[8.1] TESTE 6: Tentativa de deleção de post por terceiro (Usuário C)..."
HTTP_CODE_DEL_FORBIDDEN=$(curl -s -o /tmp/resp_del_forb.json -w "%{http_code}" \
  -X DELETE "${BASE_URL}/api/v1/community/posts/${POST1_ID}" \
  -H "Authorization: Bearer ${TOKEN_C}")

echo "HTTP Code: ${HTTP_CODE_DEL_FORBIDDEN}"
cat /tmp/resp_del_forb.json
echo ""
if [[ "$HTTP_CODE_DEL_FORBIDDEN" == "403" ]]; then
  echo "✅ APROVADO: Exclusão por terceiro bloqueada com HTTP 403 Forbidden."
else
  echo "❌ FALHOU: Esperava HTTP 403 ao tentar excluir post de terceiro."
  exit 1
fi

echo -e "\n[8.2] TESTE 7: Deleção do post pelo próprio autor (Usuário B) - LGPD Art. 18..."
HTTP_CODE_DEL_OK=$(curl -s -o /tmp/resp_del_ok.json -w "%{http_code}" \
  -X DELETE "${BASE_URL}/api/v1/community/posts/${POST1_ID}" \
  -H "Authorization: Bearer ${TOKEN_B}")

echo "HTTP Code: ${HTTP_CODE_DEL_OK}"
cat /tmp/resp_del_ok.json
echo ""
if [[ "$HTTP_CODE_DEL_OK" == "200" && "$(cat /tmp/resp_del_ok.json)" == *"Partilha excluída com sucesso"* ]]; then
  echo "✅ APROVADO: Deleção pelo autor concluída com sucesso (HTTP 200)."
else
  echo "❌ FALHOU: Esperava HTTP 200 na deleção pelo autor."
  exit 1
fi

echo -e "\n=========================================================="
echo "    TODOS OS TESTES VIA CURL PASSARAM COM 100% DE SUCESSO! "
echo "=========================================================="
