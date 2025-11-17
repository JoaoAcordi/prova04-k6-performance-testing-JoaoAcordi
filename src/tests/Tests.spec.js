import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Métricas personalizadas
export const activityTrend = new Trend('getActivityDuration', true);
export const okRate = new Rate('RateRequestOK');

// Configurações do teste
export const options = {
  thresholds: {
    'http_req_failed': ['rate<0.25'],
    'getActivityDuration': ['p(90)<6800'],
    'RateRequestOK': ['rate>0.75'],
  },

  stages: [
    { duration: '10s', target: 7 },   // warm-up
    { duration: '60s', target: 92 },  // ramp-up
    { duration: '110s', target: 92 }, // sustentação
    { duration: '30s', target: 7 }    // ramp-down
  ]
};

// Relatórios
export function handleSummary(data) {
  return {
    'src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

// Execução de cada VU
export default function () {
  const API = 'https://fakerestapi.azurewebsites.net/api/v1/Activities';

  const response = http.get(API, {
    headers: { 'Content-Type': 'application/json' }
  });

  // Alimenta as métricas
  activityTrend.add(response.timings.duration);
  okRate.add(response.status === 200);

  // Validação
  check(response, {
    'Status é 200': () => response.status === 200
  });
}
