import path from 'pathe';
import { show } from '../utils'

try {
  show(path.join('a', 'b', 'c'));
} catch (e) {
  show(e);
}
