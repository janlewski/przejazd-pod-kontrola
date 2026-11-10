import { devices, expect, test } from '@playwright/test'

test.use({ viewport: devices['iPhone 13'].viewport, isMobile: true, hasTouch: true })

const ROUTES = [
  '#/',
  '#/przeglad',
  '#/przejazdy',
  '#/przejazdy/X1',
  '#/srodki',
  '#/wdrozenia',
  '#/ocena',
  '#/metoda',
]

test.beforeEach(async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort())
})

for (const path of ROUTES) {
  test(`no horizontal scroll at 390 px: ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    if (path === '#/przejazdy') await expect(page.getByText(/\d z [\d\s\u00a0]+ pozycji/)).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('menu sheet navigates and the demo button is in the first screen', async ({ page }) => {
  await page.goto('')
  const demo = await page.getByRole('link', { name: 'Otwórz demo' }).boundingBox()
  expect(demo!.y + demo!.height).toBeLessThanOrEqual(page.viewportSize()!.height)

  await page.goto('#/przeglad')
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('dialog').getByRole('link', { name: 'Środki zaradcze' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Środki zaradcze' })).toBeVisible()
  await expect(page.getByRole('dialog')).toBeHidden()
})
