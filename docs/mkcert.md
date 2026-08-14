# Gerando certificados TLS de desenvolvimento com mkcert

Recomendo usar `mkcert` para criar certificados confiáveis no ambiente de desenvolvimento.

Passos rápidos:

1. Instale mkcert:

- Windows (Chocolatey):
  ```powershell
  choco install mkcert -y
  ```

2. Instale CA local:

```powershell
mkcert -install
```

3. Gere os certificados na pasta `certs` (a partir da raiz do repo):

```powershell
mkcert -cert-file certs/pcforge.local.crt -key-file certs/pcforge.local.key localhost 127.0.0.1 pcforge.local
```

Importante: os arquivos gerados em `certs/` não devem ser versionados. O repositório ignora `certs/` por padrão — se você encontrar chaves/certificados no repositório, remova-os e gere localmente.

> Atenção: o fallback Docker/OpenSSL gera HTTPS, mas pode continuar a mostrar aviso de site não seguro. Para remover esse aviso, instale `mkcert` e use o certificado gerado por ele.

4. Para usar o host local `pcforge.local`, adicione esta linha ao seu `hosts`:

- Windows: `C:\Windows\System32\drivers\etc\hosts`
- Linux / macOS: `/etc/hosts`

```text
127.0.0.1 pcforge.local
```

5. Verifique que os arquivos foram criados:

```powershell
ls nginx\certs
```

5. Suba os containers:

```powershell
docker compose up --build
```

Se não puder instalar mkcert, o script `scripts/mkcert-generate.ps1` tenta executar o comando localmente e fornecer instruções.
