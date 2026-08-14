import { test, expect } from '@playwright/test';

test.describe('Cadastro e login de usuário', () => {
  test('Cadastro de usuário com sucesso', async ({ page }) => {
    await page.goto('/cadastro');

    await page.fill('input[name="nome"]', 'Teste Usuario');
    await page.fill('input[name="email"]', 'teste.user@example.com');
    await page.fill('input[name="cpf"]', '111.222.333-44');
    await page.fill('input[name="telefone"]', '(11) 99999-9999');
    await page.fill('input[name="dataNascimento"]', '1995-01-01');
    await page.fill('input[name="senha"]', 'senha1234');
    await page.fill('input[name="confirmarSenha"]', 'senha1234');

    await page.route('**/clientes', (route) => {
      expect(route.request().method()).toBe('POST');
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id_cliente: 100, nome: 'Teste Usuario', email: 'teste.user@example.com' }),
      });
    });

    await page.route('**/clientes/login', (route) => {
      expect(route.request().method()).toBe('POST');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ cliente: { id_cliente: 100, nome: 'Teste Usuario' }, token: 'token-abc-100' }),
      });
    });

    await page.click('button:has-text("Criar conta")');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('Cadastro de usuário com falha por dados inválidos', async ({ page }) => {
    await page.goto('/cadastro');

    await page.fill('input[name="nome"]', 'Te');
    await page.fill('input[name="email"]', 'email-invalido');
    await page.fill('input[name="cpf"]', '111');
    await page.fill('input[name="telefone"]', '(11) 999');
    await page.fill('input[name="dataNascimento"]', '2010-01-01');
    await page.fill('input[name="senha"]', '123');
    await page.fill('input[name="confirmarSenha"]', '1234');

    await page.click('button:has-text("Criar conta")');
    await expect(page.locator('text=Nome deve ter pelo menos 3 caracteres.')).toBeVisible();
    await expect(page.locator('text=Email inválido.')).toBeVisible();
    await expect(page.locator('text=CPF inválido. Digite 11 dígitos.')).toBeVisible();
    await expect(page.locator('text=Telefone inválido.')).toBeVisible();
    await expect(page.locator('text=As senhas não coincidem.')).toBeVisible();
  });

  test('Login com falha mostra mensagem de erro', async ({ page }) => {
    await page.goto('/Login');

    await page.route('**/clientes/login', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await page.fill('input[type="email"]', 'teste.user@example.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    await page.click('button:has-text("Entrar")');

    await expect(page.locator('text=Email ou senha incorretos.')).toBeVisible();
  });
});
