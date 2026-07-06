import { expect, test, type Page } from '@playwright/test';

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;
const e2eRole = process.env.E2E_ROLE || 'agent';
const e2eAgencyDomain = process.env.E2E_AGENCY_DOMAIN || 'proppost-test';

async function signIn(page: Page) {
  test.skip(!e2eEmail || !e2ePassword, 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated smoke flows.');

  await page.goto('/login');
  await page.getByRole('button', { name: new RegExp(`^${e2eRole}$`, 'i') }).click();

  if (e2eRole === 'agency') {
    await page.getByPlaceholder('agency@company.com').fill(e2eEmail!);
    await page.getByPlaceholder('e.g., acme-realty').fill(e2eAgencyDomain);
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await page.locator('input[type="password"]').fill(e2ePassword!);
    await page.getByRole('button', { name: /access workspace/i }).click();
  } else {
    await page.getByPlaceholder('name@company.com').fill(e2eEmail!);
    await page.locator('input[type="password"]').fill(e2ePassword!);
    await page.getByRole('button', { name: /sign in to dashboard/i }).click();
  }

  await expect(page).toHaveURL(/\/(agent-dashboard|agency-dashboard)/, { timeout: 30_000 });
  await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();
}

test.describe('public auth smoke', () => {
  test('signup route renders the signup experience', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /join proppost/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agent', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agency', exact: true })).toBeVisible();
  });

  test('login route renders the login experience', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder('name@company.com')).toBeVisible();
  });

  test('generate-post API returns a JSON contract', async ({ request }) => {
    const response = await request.post('/api/generate-post', {
      data: {
        property: {
          title: 'Smoke Test Listing',
          price: 2500000,
          area: 'Sandton',
          city: 'Johannesburg',
          beds: 3,
          baths: 2,
          parking: 2,
          description: 'A smoke-test property used for API contract verification.',
        },
        agent: {
          full_name: 'Smoke Test Agent',
          email: 'agent@example.com',
        },
        platform: 'Instagram',
        tone: 'Professional',
      },
    });

    expect([200, 500, 503]).toContain(response.status());
    const body = await response.json();

    if (response.status() === 200) {
      expect(body).toEqual(
        expect.objectContaining({
          headline: expect.any(String),
          body: expect.any(String),
          hashtags: expect.any(Array),
        }),
      );
    } else {
      expect(body).toEqual(expect.objectContaining({ error: expect.any(String) }));
    }
  });
});

test.describe.serial('authenticated smoke', () => {
  test('login routes to the correct dashboard', async ({ page }) => {
    await signIn(page);
    await expect(page.getByText(/overview/i).first()).toBeVisible();
  });

  test('add property flow can publish a listing', async ({ page }) => {
    await signIn(page);

    await page.getByRole('button', { name: /quick add/i }).click();
    await expect(page.getByRole('heading', { name: /add new listing/i })).toBeVisible();

    const suffix = Date.now().toString().slice(-6);
    await page.getByPlaceholder('e.g. Modern 3-Bedroom Penthouse').fill(`Smoke Test Listing ${suffix}`);
    await page.getByPlaceholder('e.g. 2500000').fill('2500000');
    await page.getByPlaceholder('e.g. Sandton').fill('Johannesburg');
    await page.getByPlaceholder('e.g. Morningside').fill('Rosebank');

    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByPlaceholder("Describe the property's best features...").fill('Smoke test listing for dashboard workflow verification.');
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /publish listing/i }).click();

    await expect(page.getByRole('heading', { name: /add new listing/i })).toBeHidden({ timeout: 20_000 });
  });

  test('post builder can generate content and schedule a post', async ({ page }) => {
    test.skip(e2eRole !== 'agent', 'Post Builder is exposed to agent accounts in the current navigation.');

    await page.route('**/api/generate-post', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          headline: 'Smoke Test Headline',
          body: 'A polished smoke-test caption for the selected listing.',
          hashtags: ['PropPost', 'RealEstate', 'SmokeTest'],
        }),
      });
    });

    await signIn(page);
    await page.getByRole('button', { name: /post builder/i }).click();
    await expect(page.getByRole('heading', { name: /post builder/i })).toBeVisible();

    const propertyCards = page.locator('button').filter({ has: page.locator('img') });
    await expect(propertyCards.first()).toBeVisible({ timeout: 20_000 });
    await propertyCards.first().click();
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /generate content/i }).click();

    await expect(page.locator('textarea')).toHaveValue('A polished smoke-test caption for the selected listing.');
    await page.getByRole('button', { name: /schedule post/i }).click();
    await expect(page.getByRole('heading', { name: /successfully scheduled/i })).toBeVisible();
  });
});
