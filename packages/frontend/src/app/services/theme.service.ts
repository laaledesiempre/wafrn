import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from 'src/environments/environment';
//TODO service imports
import { LoginService } from './login.service';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor(
    private loginService: LoginService,
    private http: HttpClient,
    private utils: UtilsService
  ) {}

  setMyTheme() {
    this.setTheme(this.loginService.getLoggedUserUUID());
  }

  updateTheme(newTheme: string) {
    return firstValueFrom(
      this.http.post(`${environment.baseUrl}/updateCSS`, { css: newTheme })
    );
  }

  // 0 no data 1 does not want custom css 2 accepts custom css
  hasUserAcceptedCustomThemes(): number {
    let res = 0;
    try {
      const storedResponse = localStorage.getItem('acceptsCustomThemes');
      res = storedResponse ? parseInt(storedResponse) : 0;
    } catch (error) {}
    return res;
  }

  async checkThemeExists(theme: string): Promise<boolean> {
    let res = false;
    try {
      const response = await firstValueFrom(
        this.http.get(`${environment.baseMediaUrl}/themes/${theme}.css`, {
          responseType: 'text',
        })
      );
      if (response && response.length > 0) {
        res = true;
      }
    } catch (error) {}
    return res;
  }

  async getMyThemeAsSting(): Promise<string> {
    let res = '';
    try {
      const themeResponse = await this.http
        .get(
          `${
            environment.baseUrl
          }/uploads/themes/${this.loginService.getLoggedUserUUID()}.css`,
          { responseType: 'text' }
        )
        .toPromise();
      if (themeResponse && themeResponse.length > 0) {
        res = themeResponse;
      }
    } catch (error) {}
    return res;
  }

  setTheme(themeToSet: string) {
    try {
      this.setStyle(
        'customUserTheme',
        `${environment.baseUrl}/uploads/themes/${themeToSet}.css`
      );
    } catch (error) {
    }
  }

  private getLinkElementForKey(key: string) {
    return (
      this.getExistingLinkElementByKey(key) ||
      this.createLinkElementWithKey(key)
    );
  }

  private getExistingLinkElementByKey(key: string) {
    return document.head.querySelector(
      `link[rel="stylesheet"].${this.getClassNameForKey(key)}`
    );
  }

  private createLinkElementWithKey(key: string) {
    const linkEl = document.createElement('link');
    linkEl.setAttribute('rel', 'stylesheet');
    linkEl.classList.add(this.getClassNameForKey(key));
    document.head.appendChild(linkEl);
    return linkEl;
  }

  private getClassNameForKey(key: string) {
    return `app-${key}`;
  }

  /**
   * Set the stylesheet with the specified key.
   */
  private setStyle(key: string, href: string) {
    this.getLinkElementForKey(key).setAttribute('href', href);
  }

  /**
   * Remove the stylesheet with the specified key.
   */
  private removeStyle(key: string) {
    const existingLinkElement = this.getExistingLinkElementByKey(key);
    if (existingLinkElement) {
      document.head.removeChild(existingLinkElement);
    }
  }
}
