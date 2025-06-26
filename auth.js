// auth.js
(function () {
  async function init() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const { sberIDRedirect, code, token, to, state, redirectUrl, runId } =
        Object.fromEntries(urlParams);

      console.log('PARAMS: ' ,Object.fromEntries(urlParams))
      
      const CUSTOM_BASE_URL_KEY =
        JSON.parse(localStorage.getItem('flutter.CUSTOM_BASE_URL_KEY')) ||
        'https://gwse.aurora.wfmt.ru'; 

      console.log('Base URL: ', CUSTOM_BASE_URL_KEY);

      if (!CUSTOM_BASE_URL_KEY) {
        throw new Error('Base URL не найден');
      }

      if (sberIDRedirect) {
        const response = await fetch(`${CUSTOM_BASE_URL_KEY}/sber/state`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`Ошибка получения стейта: ${response.statusText}`);
        }

        const stateData = await response.json();
        console.log('1: state', { ...stateData });

        const params = new URLSearchParams({ ...stateData }).toString();
        const finalUrl = `${sberIDRedirect}?${params}`;
        console.log('finalUrl', finalUrl);

        window.location.href = finalUrl;
        return;
      }

      if (code) {
        const versionResponse = await fetch('/web_version.json');

        if (!versionResponse.ok) {
          throw new Error('Не удалось загрузить версию приложения');
        }

        const { version } = await versionResponse.json();
        console.log('Данные из web_version.json:', version);

        const deviceInfo = window.btoa(
          JSON.stringify({
            appCodeName: navigator.appCodeName,
            appName: navigator.appName,
            appVersion: navigator.appVersion,
            deviceMemory: navigator.deviceMemory ?? null,
            language: navigator.language ?? navigator.browserLanguage ?? 'unknown',
            languages: Array.isArray(navigator.languages) ? [...navigator.languages] : [],
            platform: navigator.platform,
            product: navigator.product ?? 'unknown',
            productSub: navigator.productSub ?? '',
            userAgent: navigator.userAgent,
            vendor: navigator.vendor,
            vendorSub: navigator.vendorSub ?? '',
            hardwareConcurrency: navigator.hardwareConcurrency ?? null,
            maxTouchPoints: navigator.maxTouchPoints ?? 0,
          })
        );

        const headers = {
          'x-app-id': 'com.wfm.mobile.client',
          'x-app-type': 'SBER',
          'x-app-version': version,
          'x-device-info': deviceInfo,
          'x-market': 'Web',
          'x-theme': 'SBER',
        };

        const params = new URLSearchParams({ code, state }).toString();
        const requestUrl = `${CUSTOM_BASE_URL_KEY}/sber/auth?${params}`;

        console.log('2: finalUrl', requestUrl);

        const responseJWT = await fetch(requestUrl, {
          headers,
          method: 'GET',
        });

        if (!responseJWT.ok) {
          throw new Error('Ошибка авторизации');
        }

        const data = await responseJWT.json();
        const { access_token, refresh_token } = data;

        if (!access_token || !refresh_token) {
          throw new Error('Отсутствуют токены в ответе сервера');
        }

        const jwt = JSON.stringify({ refresh_token, access_token });
        window.localStorage.setItem('flutter.LOADING_USER_IMAGE', btoa(jwt));

        window.location.href = redirectUrl || `${window.location.origin}/#/home_route_name`;
      }
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      const errorDiv = document.getElementById('error-message');
      if (errorDiv) {
        errorDiv.textContent = 'Что-то пошло не так, попробуйте позже';
      }
    }
  }

  // Запускаем после загрузки страницы
  window.addEventListener('DOMContentLoaded', init);
})();