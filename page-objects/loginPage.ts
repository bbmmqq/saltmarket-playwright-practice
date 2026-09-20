import {Locator, Page} from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = this.page.getByTestId('login-email');
    this.passwordInput = this.page.getByTestId('login-password');
    this.submitButton = this.page.getByTestId('login-submit');
    this.errorMessage = this.page.getByTestId('login-error');
  }

    async goto() {
    await this.page.goto('/login.html');
  }
  
    async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
