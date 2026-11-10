import { expect, test } from '@playwright/test'

test('landing: „Otwórz demo” lands on the map with X1 selected', async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort())
  await page.goto('')

  await expect(page.getByRole('heading', { level: 1, name: 'Przejazd pod kontrolą' })).toBeVisible()
  await expect(
    page
      .getByText('3336')
      .or(page.getByText(/3\s336/))
      .first(),
  ).toBeVisible()
  await expect(page.getByRole('note', { name: 'Dane fikcyjne' })).toBeVisible()

  await page.getByRole('button', { name: 'Jak to działa' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Jak to działa' })).toBeFocused()

  await page.getByRole('link', { name: 'Otwórz demo' }).click()
  await expect(page).toHaveURL(/#\/przejazdy\?wybrany=X1$/)
  await expect(page.getByRole('region', { name: 'Wybrany przejazd: Przejazd X1' })).toBeVisible()
  await expect(page.locator('.leaflet-popup-content')).toContainText('Przejazd X1')
})

test('/#/przejazdy lists real crossings and labelled fictional cases', async ({ page }) => {
  // OSM tiles are not needed for the smoke test (and must not be fetched in bulk).
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort())
  await page.goto('#/przejazdy')

  await expect(page.getByRole('heading', { level: 1, name: 'Przejazdy' })).toBeVisible()
  await expect(page.getByRole('note', { name: 'Dane fikcyjne' })).toBeVisible()
  await expect(page.getByText(/Wyświetlono \d[\d\s\u00a0]* z \d/)).toBeVisible()
  const table = page.getByRole('table', { name: /Przejazdy i przypadki/ })
  await expect(table.getByRole('link', { name: 'Przejazd X1', exact: true })).toBeVisible()
  await expect(page.locator('.leaflet-control-attribution')).toContainText('OpenStreetMap contributors')

  await page.getByLabel('Numer, identyfikator lub jednostka').fill('082 006 629')
  await expect(table.getByRole('link', { name: '082 006 629' })).toBeVisible()
})

test('X1 card: priority with reasons, diagnosis, countermeasures; deep link survives reload', async ({
  page,
}) => {
  await page.goto('#/przejazdy/X1')
  await page.reload()

  await expect(page.getByRole('heading', { level: 1, name: 'Przejazd X1' })).toBeVisible()
  await expect(page.getByRole('note', { name: 'Dane fikcyjne' })).toBeVisible()
  await expect(page.getByText('I-SYMPTOM-HIGH').first()).toBeVisible()

  await page.getByRole('tab', { name: 'Diagnoza' }).click()
  await expect(page.getByText('Objeżdżanie opuszczonych półrogatek')).toBeVisible()

  await page.getByRole('tab', { name: 'Środki' }).click()
  const firstRow = page
    .getByRole('table', { name: /Środki zaradcze/ })
    .getByRole('row')
    .nth(1)
  await expect(firstRow).toContainText(/CM-MEDIAN|CM-4Q/)
})
