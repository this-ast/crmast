import { test, expect } from '@playwright/test'

const BASE_URL = process.env.LOGIN_TEST_URL || 'http://localhost:5173'

test('login flow test', async ({ page }) => {
  // 1. Go to login page
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  
  // 2. Clear localStorage
  await page.evaluate(() => localStorage.clear())
  
  // 3. Reload to ensure clean state
  await page.reload({ waitUntil: 'networkidle' })
  
  // Check login page loaded
  await expect(page.locator('text=CRM Недвижимость')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('text=Войдите в свой аккаунт')).toBeVisible()
  
  // 4. Fill email
  await page.getByLabel(/email/i).fill('astemir@crm.agency')
  
  // 5. Fill password
  await page.getByPlaceholder('Введите пароль').fill('Astemir2026!')
  
  // 6. Click "Войти" button
  await page.getByRole('button', { name: 'Войти' }).click()
  
  // 7. Wait up to 15 seconds and observe
  await page.waitForTimeout(15000)
  
  // Take screenshot of final state
  await page.screenshot({ path: 'login-flow-result.png', fullPage: true })
  
  // Report: check current URL and any visible error
  const url = page.url()
  const hasError = await page.locator('text=Неверный email или пароль').isVisible()
  const hasLoading = await page.locator('button:has-text("Войти")').isVisible()
  const button = page.getByRole('button', { name: 'Войти' })
  const buttonText = await button.textContent()
  const isOnDashboard = url.includes('/') && !url.includes('/login')
  
  console.log('=== LOGIN FLOW TEST REPORT ===')
  console.log('Final URL:', url)
  console.log('Error message visible:', hasError)
  console.log('Still on login page:', url.includes('/login'))
  console.log('Redirected to dashboard:', isOnDashboard)
  console.log('Screenshot saved to login-flow-result.png')
})
