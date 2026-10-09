(function () {
  'use strict';

  const API_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';
  const MAIN_CODES = ['USD', 'EUR', 'CNY'];

  const ratesListEl = document.getElementById('ratesList');
  const dateEl      = document.getElementById('widgetDate');
  const inputEl     = document.getElementById('currencyInput');
  const searchBtn   = document.getElementById('searchBtn');
  const resultEl    = document.getElementById('searchResult');
  const errorEl     = document.getElementById('searchError');

  let valuteCache = null;

  function formatRub(value) {
    return value.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }) + ' ₽';
  }

  function getArrow(current, previous) {
    if (current > previous) {
      return { symbol: '▲', cls: 'rate__arrow--up' };
    }
    if (current < previous) {
      return { symbol: '▼', cls: 'rate__arrow--down' };
    }
    return { symbol: '•', cls: '' };
  }

  async function loadRates() {
    try {
      const response = await fetch(API_URL, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Сервер вернул статус ' + response.status);
      }

      const data = await response.json();

      if (!data || !data.Valute) {
        throw new Error('Некорректный формат ответа API');
      }

      valuteCache = data.Valute;

      if (data.Date) {
        const d = new Date(data.Date);
        dateEl.textContent = d.toLocaleDateString('ru-RU');
      }

      renderMainRates();
    } catch (err) {
      console.error(err);
      ratesListEl.innerHTML =
        '<li class="rates__error">Не удалось загрузить курсы валют. ';
    }
  }

  function renderMainRates() {
    ratesListEl.innerHTML = '';

    const items = MAIN_CODES
      .map(code => valuteCache[code])
      .filter(Boolean);

    if (!items.length) {
      ratesListEl.innerHTML =
        '<li class="rates__error">В данных нет ожидаемых валют.</li>';
      return;
    }

    items.forEach(v => {
      const current  = v.Value / v.Nominal;
      const previous = v.Previous / v.Nominal;
      const arrow    = getArrow(current, previous);

      const li = document.createElement('li');
      li.className = 'rate';
      li.innerHTML = `
        <span class="rate__name">${v.Name}</span>
        <span class="rate__value">
          <span class="rate__arrow ${arrow.cls}">${arrow.symbol}</span>
          ${formatRub(current)}
        </span>
      `;
      ratesListEl.appendChild(li);
    });
  }

  function findValute(query) {
    const q = query.trim().toLowerCase();
    if (!q) return { error: 'Введите название валюты.' };

    if (!valuteCache) {
      return { error: 'Данные ещё не загружены.' };
    }

    const found = Object.values(valuteCache).find(v => {
      return (
        v.CharCode.toLowerCase() === q ||
        v.Name.toLowerCase() === q ||
        v.Name.toLowerCase().includes(q) ||
        v.CharCode.toLowerCase().includes(q)
      );
    });

    if (!found) {
      return { error: `Валюта «${query}» не найдена.` };
    }

    return { value: found };
  }

  function handleSearch() {
    resultEl.textContent = '';
    errorEl.textContent  = '';

    const query = inputEl.value;
    const res   = findValute(query);

    if (res.error) {
      errorEl.textContent = res.error;
      return;
    }

    const v = res.value;
    const current = v.Value / v.Nominal;
    const arrow   = getArrow(v.Value, v.Previous);

    resultEl.innerHTML = `
      <strong>${v.Name}</strong> (${v.CharCode}): 
      <span class="rate__arrow ${arrow.cls}">${arrow.symbol}</span>
      ${formatRub(current)}
    `;
  }

  searchBtn.addEventListener('click', handleSearch);

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSearch();
  });

  loadRates();
})();