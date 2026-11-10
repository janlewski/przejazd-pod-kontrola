import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = [
  { path: '#/', heading: 'Przegląd' },
  { path: '#/przejazdy', heading: 'Przejazdy' },
  { path: '#/przejazdy/X1', heading: 'Przejazd X1' },
  { path: '#/srodki', heading: 'Środki zaradcze' },
  { path: '#/wdrozenia', heading: 'Wdrożenia' },
  { path: '#/ocena', heading: 'Ocena przed/po' },
  { path: '#/metoda', heading: 'Metoda i źródła' },
]

for (const { path, heading } of PAGES) {
  test(`WCAG 2.1 AA (axe): ${path}`, async ({ page }) => {
    await page.route('https://tile.openstreetmap.org/**', (route) => route.abort())
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    if (path === '#/przejazdy') await expect(page.getByText(/Wyświetlono/)).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Leaflet's own map controls are third-party markup.
      .exclude('.leaflet-control-container')
      .analyze()
    expect(
      results.violations.map(
        (v) =>
          `${v.id}: ${v.nodes
            .map((n) => n.target.join(' '))
            .slice(0, 3)
            .join(', ')}`,
      ),
    ).toEqual([])
  })
}
