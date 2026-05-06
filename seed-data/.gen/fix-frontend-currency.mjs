import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const files = [
  'frontend/src/app/features/booking/booking-confirmation/booking-confirmation.component.ts',
  'frontend/src/app/features/operator/operator-dashboard/operator-dashboard.component.ts',
  'frontend/src/app/features/admin/admin-dashboard/admin-dashboard.component.ts',
  'frontend/src/app/features/dashboard/user-dashboard/user-dashboard.component.ts',
  'frontend/src/app/features/flights/flight-search/flight-search.component.ts',
  'frontend/src/app/features/booking/booking-flow/booking-flow.component.ts',
  'frontend/src/app/features/flights/flight-detail/flight-detail.component.ts',
  'frontend/src/app/features/home/home.component.ts'
];

let total = 0;
for (const f of files) {
  let data = readFileSync(f, 'utf8');
  let count = 0;
  // Escape $ that is followed by { but NOT already preceded by \
  const newData = data.replace(/(?<!\\)\$\{/g, () => { count++; return '\\${'; });
  writeFileSync(f, newData);
  console.log(f.split('/').pop() + ': +' + count);
  total += count;
}
console.log('Total: ' + total);

// Final verification across all .ts files
const allTs = execSync('find frontend/src -name *.ts').toString().split('\n').filter(Boolean);
const bad = [];
for (const f of allTs) {
  const d = readFileSync(f, 'utf8');
  // Look for unescaped ${ followed by { or (
  const m = d.match(/(?<!\\)\$\{[\{\(]/g);
  if (m) bad.push(f + ': ' + m.length + ' unescaped');
}
console.log('---');
console.log(bad.length === 0 ? 'ALL CLEAN' : 'STILL BAD:\n' + bad.join('\n'));
