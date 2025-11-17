import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getContactsDuration = new Trend('get_contacts_duration');
export const RateContentOK = new Rate('content_ok');

export const options = {
  stages: [
    { duration: '30s', target: 7 },
    { duration: '2m30s', target: 92 },
    { duration: '30s', target: 0 }
  ],

  thresholds: {
    http_req_duration: ['p(90)<6800'],

    content_ok: ['rate>0.75'],

    get_contacts_duration: ['p(90)<6800']
  }
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://www1.satc.edu.br/portais/acesso/public/#/';

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const res = http.get(baseUrl, params);

  getContactsDuration.add(res.timings.duration);

  RateContentOK.add(res.status < 400);

  check(res, {
    'Status 200 ou 3xx': r => r.status < 400
  });
}
