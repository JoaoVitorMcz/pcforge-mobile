import { test, expect } from '@playwright/test';

test('login com credenciais inválidas exibe mensagem de erro', async ({ page }) => {
  await page.route('**/clientes/login', (route) => {
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Credenciais inválidas' }),
    });
  });

  await page.goto('/Login');
  await page.fill('input[type="email"]', 'invalido@example.com');
  await page.fill('input[type="password"]', 'senhaerrada');
  await page.click('button:has-text("Entrar")');

  await expect(page.locator('text=Email ou senha incorretos.')).toBeVisible();
});

test('fluxo de login funciona e atualiza header', async ({ page }) => {
  // mock da API de login
  await page.route('**/clientes/login', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        cliente: { id_cliente: 123, nome: 'Teste Usuario' },
        token: 'token-abc-123',
      }),
    });
  });

  await page.goto('/Login');

  await page.fill('input[type="email"]', 'teste@example.com');
  await page.fill('input[type="password"]', 'senha123');
  await page.click('button:has-text("Entrar")');

  // header lê o localStorage e atualiza o nome — esperar que o texto apareça
  await expect(page.locator('text=Olá, Teste Usuario')).toBeVisible();
});
