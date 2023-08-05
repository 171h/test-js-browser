import path from 'pathe';

try {
  document.body.innerText = path.join('foo', 'bar');
} catch (e) {
  document.body.innerText = String(e);
}
